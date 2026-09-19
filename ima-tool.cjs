#!/usr/bin/env node
/**
 * ima-tool.cjs —— 免转义的 ima OpenAPI 调用封装（Windows cmd 友好）
 *
 * 用法：
 *   node ima-tool.cjs <apiPath> [key=value ...] [--out=文件名] [--keys]
 *   node ima-tool.cjs download <url> <输出文件路径> [--referer=url]
 *
 * 说明：
 *   - 自动为 key 推断类型：整数→Number，"true"/"false"→Boolean，其余→String
 *   - 数组：`ids[]=a` 追加；对象数组：`params[0].name=x`
 *   - 结果统一以 UTF-8 写入 .ima-out/<out>.json，避开 cmd 控制台编码问题
 *
 * 示例：
 *   node ima-tool.cjs openapi/wiki/v1/search_knowledge_base query= cursor= limit=20
 *   node ima-tool.cjs openapi/wiki/v1/get_media_info media_id=xxx
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SKILL_DIR = 'C:\\Users\\ZXL\\.codebuddy\\skills\\腾讯ima';
const API_SCRIPT = path.join(SKILL_DIR, 'ima_api.cjs');
const OUT_DIR = path.join(__dirname, '.ima-out');

function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (v !== '' && /^-?\d+$/.test(v)) return Number(v);
  return v;
}

function assign(root, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const isArray = raw.endsWith('[]');
    const isIndexed = /\[\d+\]$/.test(raw);
    const name = raw.replace(/\[\]$/, '').replace(/\[\d+\]$/, '');
    const last = i === parts.length - 1;

    if (last) {
      if (isArray) {
        if (!Array.isArray(cur[name])) cur[name] = [];
        cur[name].push(value);
      } else {
        cur[name] = value;
      }
      return;
    }
    if (isIndexed) {
      const idx = Number(raw.match(/\[(\d+)\]$/)[1]);
      if (!Array.isArray(cur[name])) cur[name] = [];
      if (!cur[name][idx]) cur[name][idx] = {};
      cur = cur[name][idx];
    } else {
      if (typeof cur[name] !== 'object' || cur[name] === null) cur[name] = {};
      cur = cur[name];
    }
  }
}

const TYPE_NAME = {
  1: 'PDF',
  3: 'WORD',
  4: 'PPT',
  5: 'EXCEL',
  6: 'WEB',
  7: 'TXT',
  9: 'IMG',
  11: 'NOTE',
  13: 'AUDIO',
  14: 'VIDEO',
  15: 'OTHER',
  99: 'DIR',
};

/** 把各类响应压成「类型 | 标题 | id」紧凑列表 */
function digest(raw) {
  const d = raw.data || raw;
  const buckets = [
    ['knowledge_list', '当前目录'],
    ['info_list', '检索/列表'],
    ['results', '结果'],
    ['list', '列表'],
  ];
  const lines = [];
  if (Array.isArray(d.info_list) && d.info_list[0] && d.info_list[0].kb_name) {
    lines.push('## 知识库列表');
    for (const k of d.info_list) {
      lines.push(`KB\t${k.kb_name}\t内容数=${k.content_count}\t${k.base_type}\t${k.kb_id}`);
    }
    return lines;
  }
  for (const [key, label] of buckets) {
    const arr = d[key];
    if (!Array.isArray(arr)) continue;
    lines.push(`## ${label} (${arr.length})`);
    for (const it of arr) {
      const type = TYPE_NAME[it.media_type] || `T${it.media_type}`;
      const id = it.media_id || it.id || '';
      const title = it.title || it.name || '';
      const extra = it.parent_folder_id ? `\tfolder=${it.parent_folder_id}` : '';
      lines.push(`${type}\t${title}\t${id}${extra}`);
    }
  }
  if (d.is_end !== undefined) lines.push(`is_end=${d.is_end}`);
  if (d.next_cursor) lines.push(`next_cursor=${d.next_cursor}`);
  if (!lines.length) lines.push(JSON.stringify(raw).slice(0, 2000));
  return lines;
}

function writeOut(name, text) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(file, text, 'utf8');
  process.stdout.write(`[ima-tool] -> ${file}\n`);
}

function collectHeaders(argv) {
  const headers = {};
  for (const a of argv) {
    if (a.startsWith('--header=')) {
      const kv = a.slice('--header='.length);
      const i = kv.indexOf(':');
      if (i > 0) headers[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
    }
  }
  const ref = argv.find((a) => a.startsWith('--referer='));
  if (ref) headers.Referer = ref.slice('--referer='.length);
  return headers;
}

async function main() {
  const argv = process.argv.slice(2);
  const outArg = argv.find((a) => a.startsWith('--out='));
  let outName = outArg ? outArg.slice('--out='.length) : 'last';

  if (argv[0] === 'download') {
    const url = argv[1];
    const dest = argv[2];
    const headers = collectHeaders(argv);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      process.stderr.write(`[ima-tool] download failed: HTTP ${res.status}\n`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    process.stdout.write(`[ima-tool] saved ${buf.length} bytes -> ${dest}\n`);
    return;
  }

  if (argv[0] === 'pull') {
    // pull <media_id> <outdir> [--name=前缀]
    const mediaId = argv[1];
    const outdir = argv[2] || '.ima-cache';
    const nameArg = argv.find((a) => a.startsWith('--name='));
    const prefix = nameArg ? nameArg.slice('--name='.length) : mediaId.slice(0, 24).replace(/[^\w.-]/g, '_');

    const raw = execFileSync(process.execPath, [API_SCRIPT, 'openapi/wiki/v1/get_media_info', JSON.stringify({ media_id: mediaId })], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    const info = JSON.parse(raw);
    if (info.code !== 0 || !info.data || !info.data.url_info || !info.data.url_info.url) {
      process.stderr.write(`[ima-tool] get_media_info failed: ${raw.slice(0, 300)}\n`);
      process.exit(1);
    }
    const { url, headers = {} } = info.data.url_info;
    const res = await fetch(url, { headers: { ...collectHeaders(argv), ...headers } });
    if (!res.ok) {
      process.stderr.write(`[ima-tool] pull failed: HTTP ${res.status} ${url.slice(0, 120)}\n`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
    const extMap = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'text/html': '.html',
      'text/plain': '.txt',
    };
    let ext = extMap[ct] || '';
    if (!ext) {
      const m = new URL(url).pathname.match(/\.[a-z0-9]{2,5}$/i);
      ext = m ? m[0] : (ct.startsWith('text/html') ? '.html' : '.bin');
    }
    const dest = path.join(outdir, prefix + ext);
    fs.mkdirSync(outdir, { recursive: true });
    fs.writeFileSync(dest, buf);
    writeOut('pull-last', JSON.stringify({ mediaId, url, contentType: ct, bytes: buf.length, dest: path.resolve(dest) }, null, 2));
    process.stdout.write(`[ima-tool] pulled ${buf.length} bytes (${ct}) -> ${path.resolve(dest)}\n`);
    return;
  }

  if (argv[0] === 'digest') {
    const src = argv[1];
    const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
    const lines = digest(raw);
    const text = lines.join('\n');
    writeOut(outName, JSON.stringify(text, null, 2));
    return;
  }

  const apiPath = argv[0];
  const body = {};
  if (!apiPath) {
    process.stderr.write('[ima-tool] missing apiPath\n');
    process.exit(1);
  }
  for (const arg of argv.slice(1)) {
    if (arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq < 0) continue;
    assign(body, arg.slice(0, eq), coerce(arg.slice(eq + 1)));
  }

  let out;
  try {
    out = execFileSync(process.execPath, [API_SCRIPT, apiPath, JSON.stringify(body)], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const errText = (e.stderr || '').toString();
    writeOut(outName, JSON.stringify({ __error: true, apiPath, body, stdout: (e.stdout || '').toString(), stderr: errText }, null, 2));
    process.stderr.write(`[ima-tool] call failed: ${errText.slice(0, 400)}\n`);
    process.exit(1);
  }

  let pretty = out;
  try {
    pretty = JSON.stringify(JSON.parse(out), null, 2);
  } catch (_) {
    /* 原样输出 */
  }
  writeOut(outName, pretty);
}

main();
