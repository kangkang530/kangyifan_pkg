# -*- coding: utf-8 -*-
"""site-check.py —— 站点内容验收检查工具

用法（在项目根目录执行）：
  python site-check.py                 # 静态检查：结构、占位、图片、链接、脑图
  python site-check.py --http          # 附加：本地服务 HTTP 可达性检查
  python site-check.py --base http://127.0.0.1:8000 --http

检查项：
  G1 构建前结构：每页存在 H1；无遗留「页面状态」提示框
  G2 占位统计：*待补充* 与 admonition 占位数量（允许为 0，统计便于跟踪进度）
  G3 图片有效：Markdown 中引用的本地图片文件均存在
  G4 链接有效：站内 .md 相对链接目标均存在
  G5 脑图存在：统计每页 Mermaid 块数量
  G6 HTTP 可达（可选）
输出：控制台汇总 + .ima-out/site-check-report.md
"""
import argparse
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
REPORT = ROOT / ".ima-out" / "site-check-report.md"

IMG_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")
LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+?\.md)(?:#[^)]*)?\)")
H1_RE = re.compile(r"^#\s+\S", re.M)
MERMAID_RE = re.compile(r"^```mermaid", re.M)


def nav_pages():
    """从 mkdocs.yml 的 nav 中提取页面清单（保序）"""
    text = (ROOT / "mkdocs.yml").read_text(encoding="utf-8")
    body = text.split("\nnav:\n", 1)[-1]
    pages = []
    for line in body.splitlines():
        m = re.search(r":\s*([\w./-]+\.md)\s*$", line.strip().lstrip("- ").strip())
        if not m:
            m = re.search(r"([\w./-]+\.md)\s*$", line)
        if m:
            pages.append(m.group(1))
    # 去重保序
    seen = set()
    out = []
    for p in pages:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


FENCE_RE = re.compile(r"^```.*?^```", re.M | re.S)


INLINE_CODE_RE = re.compile(r"`[^`\n]*`")


def strip_fences(text):
    """去掉围栏代码块与行内代码，避免把示例链接/图片当成真实引用"""
    return INLINE_CODE_RE.sub("`code`", FENCE_RE.sub("\n", text))


def page_url(base, rel):
    p = rel.replace("\\", "/")
    if p == "index.md":
        return base + "/"
    return f"{base}/{p[:-3]}/"


def check_page(rel):
    fp = DOCS / rel
    r = {
        "page": rel,
        "exists": fp.exists(),
        "chars": 0,
        "placeholders": 0,
        "pending_admonition": 0,
        "has_h1": False,
        "status_box": False,
        "mermaid": 0,
        "bad_images": [],
        "bad_links": [],
    }
    if not fp.exists():
        return r
    text = fp.read_text(encoding="utf-8")
    body = strip_fences(text)
    r["chars"] = len(re.sub(r"\s+", "", body))
    r["placeholders"] = len(re.findall(r"\*待补充[：:]?", body))
    r["pending_admonition"] = len(re.findall(r'!!!\s+(?:warning|info)\s+"[^"]*待人工补充[^"]*"', body))
    r["has_h1"] = bool(H1_RE.search(text))
    r["status_box"] = '!!! info "页面状态"' in text
    r["mermaid"] = len(MERMAID_RE.findall(text))

    for img in IMG_RE.findall(body):
        if img.startswith(("http://", "https://")):
            continue
        if not (fp.parent / img.split("#")[0]).exists():
            r["bad_images"].append(img)
    for link in LINK_RE.findall(body):
        if link.startswith(("http://", "https://")):
            continue
        if not (fp.parent / link).resolve().exists():
            r["bad_links"].append(link)
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--http", action="store_true", help="附加 HTTP 可达性检查")
    ap.add_argument("--base", default="http://127.0.0.1:8000", help="本地服务地址")
    a = ap.parse_args()

    pages = nav_pages()
    rows = [check_page(p) for p in pages]

    total_ph = sum(r["placeholders"] for r in rows)
    total_gap = sum(r["pending_admonition"] for r in rows)
    gap_pages = [r["page"] for r in rows if r["pending_admonition"]]
    total_mermaid = sum(r["mermaid"] for r in rows)
    bad_img = [(r["page"], i) for r in rows for i in r["bad_images"]]
    bad_link = [(r["page"], l) for r in rows for l in r["bad_links"]]
    status_left = [r["page"] for r in rows if r["status_box"]]
    filled = [r for r in rows if r["placeholders"] == 0 and r["chars"] > 800]

    lines = ["# 站点内容验收报告", ""]
    lines.append(f"- nav 页面数：**{len(rows)}**")
    lines.append(f"- 已填充页（无骨架占位且正文 > 800 字）：**{len(filled)}**")
    lines.append(f"- 残留 `*待补充*`：**{total_ph}**")
    lines.append(f"- 「待人工补充」知识库缺口标注：**{total_gap}** 处，涉及 {len(gap_pages)} 页")
    lines.append(f"- Mermaid 脑图块数：**{total_mermaid}**")
    lines.append(f"- 失效图片引用：**{len(bad_img)}**")
    lines.append(f"- 失效站内链接：**{len(bad_link)}**")
    lines.append(f"- 残留「页面状态」提示框：**{len(status_left)}**")
    lines.append("")
    lines.append("| 页面 | 正文字数 | 待补充 | 待人工补充框 | 脑图 | 图失效 | 链失效 | H1 |")
    lines.append("|---|---|---|---|---|---|---|---|")
    for r in rows:
        lines.append(
            f"| {r['page']} | {r['chars']} | {r['placeholders']} | {r['pending_admonition']} | "
            f"{r['mermaid']} | {len(r['bad_images'])} | {len(r['bad_links'])} | {'Y' if r['has_h1'] else 'N'} |"
        )

    if bad_img:
        lines += ["", "## 失效图片引用", ""] + [f"- `{p}` → `{i}`" for p, i in bad_img]
    if bad_link:
        lines += ["", "## 失效站内链接", ""] + [f"- `{p}` → `{l}`" for p, l in bad_link]
    if status_left:
        lines += ["", "## 待清理的页面状态提示", ""] + [f"- `{p}`" for p in status_left]

    if a.http:
        # mkdocs serve 会把站点挂在 site_url 的路径前缀下（如 /kangyifan_pkg/）
        prefix = ""
        m = re.search(r"^site_url:\s*(\S+)", (ROOT / "mkdocs.yml").read_text(encoding="utf-8"), re.M)
        if m:
            prefix = urlparse(m.group(1)).path.rstrip("/")
        a.base = a.base.rstrip("/") + prefix
        lines += ["", f"## HTTP 可达性（base = {a.base}）", ""]
        ok = 0
        for r in rows:
            url = page_url(a.base, r["page"])
            try:
                with urllib.request.urlopen(url, timeout=15) as resp:
                    code = resp.status
            except Exception as e:  # noqa: BLE001
                code = f"ERR {e}"
            if code == 200:
                ok += 1
            lines.append(f"- {url} → {code}")
        lines.insert(1, f"\nHTTP 200 页面：**{ok}/{len(rows)}**\n")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines), encoding="utf-8")

    print("[site-check] 页面数", len(rows))
    print("[site-check] 已填充页", len(filled))
    print("[site-check] 残留待补充", total_ph)
    print("[site-check] 待人工补充标注", total_gap, "处 /", len(gap_pages), "页")
    print("[site-check] 脑图块", total_mermaid)
    print("[site-check] 失效图片", len(bad_img))
    print("[site-check] 失效链接", len(bad_link))
    print("[site-check] 报告 ->", REPORT)
    return 0 if not (bad_img or bad_link) else 1


if __name__ == "__main__":
    sys.exit(main())
