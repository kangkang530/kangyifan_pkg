# -*- coding: utf-8 -*-
"""convert-diagrams.py —— 把站点中的 Mermaid mindmap 脑图转换为「左→右、上→下」的
flowchart LR 简约树形结构（避免中心发散式布局）。

规则：
  - 仅处理 ```mermaid 且首行是 mindmap 的围栏块，其它 Mermaid 块原样保留
  - 用缩进推断层级，逐条生成 `父 --> 子` 边，节点 ID 用 N0、N1…
  - 节点文本统一加引号，去除 mindmap 的 root((...)) 语法
  - 已转换（首行为 flowchart/graph）的块不会被重复处理

用法：
  python convert-diagrams.py            # 预览将要改动的位置
  python convert-diagrams.py --write    # 实际写入
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"

BLOCK_RE = re.compile(r"```mermaid[ \t]*\r?\n(.*?)```", re.S)


def convert_block(body: str):
    """把 mindmap 块体转换为 flowchart LR 块体；不是 mindmap 返回 None"""
    lines = [l for l in body.splitlines()]
    if not lines or lines[0].strip() != "mindmap":
        return None

    nodes = []  # (depth, label, indent)
    for raw in lines[1:]:
        if not raw.strip():
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        label = raw.strip()
        label = re.sub(r"^root\((.*)\)$", r"\1", label)   # root((x)) / root(x)
        label = re.sub(r"^\((.*)\)$", r"\1", label)
        label = label.replace('"', "'")
        nodes.append((indent, label))

    if not nodes:
        return None

    # 按缩进层级构建父子关系
    ids = [f"N{i}" for i in range(len(nodes))]
    out = ["flowchart LR"]
    stack = []  # [(indent, node_index)]
    for i, (indent, label) in enumerate(nodes):
        out.append(f'  {ids[i]}["{label}"]')
        while stack and stack[-1][0] >= indent:
            stack.pop()
        if stack:
            out.append(f"  {ids[stack[-1][1]]} --> {ids[i]}")
        stack.append((indent, i))
    return "\n".join(out) + "\n"


def convert_file(path: Path):
    text = path.read_text(encoding="utf-8")
    changed = {"n": 0}

    def repl(m):
        new_body = convert_block(m.group(1))
        if new_body is None:
            return m.group(0)
        changed["n"] += 1
        return "```mermaid\n" + new_body + "```"

    new_text = BLOCK_RE.sub(repl, text)
    if changed["n"] and new_text != text:
        path.write_text(new_text, encoding="utf-8")
    return changed["n"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="实际写入（默认只预览）")
    a = ap.parse_args()

    total = 0
    targets = []
    for f in sorted(DOCS.rglob("*.md")):
        n = 0
        if a.write:
            n = convert_file(f)
        else:
            text = f.read_text(encoding="utf-8")
            n = sum(1 for m in BLOCK_RE.finditer(text) if convert_block(m.group(1)) is not None)
        if n:
            targets.append((f.relative_to(ROOT), n))
            total += n

    for p, n in targets:
        print(f"  {p}  ({n} 个 mindmap)")
    mode = "已写入" if a.write else "待转换（未写入）"
    print(f"[convert-diagrams] {mode}：{total} 个块，涉及 {len(targets)} 个文件")
    return 0


if __name__ == "__main__":
    sys.exit(main())
