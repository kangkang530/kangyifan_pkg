# -*- coding: utf-8 -*-
"""kb-extract.py —— 本地文件内容抽取工具（供知识库内容导入站点使用）

子命令：
  text    <file> [--out OUT.txt] [--pages 1-5]      抽取文本（PDF/DOCX/XLSX）
  images  <file> --outdir DIR [--prefix P] [--min-px 120]   抽取内嵌图片
  render  <file> --outdir DIR [--pages 1,2] [--dpi 150]     将 PDF 页面渲染为 PNG
  html-img <htmlfile> [--out OUT.txt]               列出 HTML 中的图片地址

说明：所有文本输出均为 UTF-8；status 输出到 stdout，便于脚本链路判断。
"""
import argparse
import io
import re
import sys
from pathlib import Path

MIN_PX_DEFAULT = 120


def log(*a):
    print(*a, file=sys.stderr)


def write_text(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def parse_pages(spec, total):
    """'1-5' / '1,3,7' -> [0,1,2,3,4]（0 基）"""
    if not spec:
        return list(range(total))
    out = []
    for part in str(spec).split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            out.extend(range(int(a) - 1, int(b)))
        else:
            out.append(int(part) - 1)
    return [i for i in out if 0 <= i < total]


# ---------------------------------------------------------------- PDF
def pdf_text(src, pages=None):
    import fitz  # pymupdf

    doc = fitz.open(src)
    idx = parse_pages(pages, doc.page_count)
    chunks = []
    empty = 0
    for i in idx:
        t = doc[i].get_text().strip()
        if not t:
            empty += 1
        chunks.append(f"\n\n<!-- ===== 第 {i + 1} 页 ===== -->\n\n{t}")
    doc.close()
    has_layer = empty < max(1, len(idx))
    return "".join(chunks).strip(), {
        "pages": doc.page_count if False else len(idx),
        "empty_pages": empty,
        "has_text_layer": has_layer,
    }


def pdf_images(src, outdir, prefix, min_px):
    import fitz

    doc = fitz.open(src)
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    saved = []
    seen = set()
    for pno in range(doc.page_count):
        for img in doc[pno].get_images(full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            try:
                info = doc.extract_image(xref)
            except Exception:
                continue
            w, h = info.get("width", 0), info.get("height", 0)
            if min(w, h) < min_px:
                continue
            ext = info.get("ext", "png")
            name = f"{prefix}-p{pno + 1}-{xref}.{ext}"
            (outdir / name).write_bytes(info["image"])
            saved.append((name, w, h, pno + 1))
    doc.close()
    return saved


def pdf_render(src, outdir, pages, dpi, prefix="page"):
    import fitz

    doc = fitz.open(src)
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    saved = []
    for i in parse_pages(pages, doc.page_count):
        pix = doc[i].get_pixmap(dpi=dpi)
        name = f"{prefix}-p{i + 1:02d}.png"
        pix.save(str(outdir / name))
        saved.append((name, pix.width, pix.height))
    doc.close()
    return saved


# ---------------------------------------------------------------- DOCX
def docx_text(src):
    import docx

    d = docx.Document(src)
    lines = []
    for p in d.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        style = (p.style.name or "").lower()
        if style.startswith("heading"):
            m = re.search(r"(\d+)", style)
            lvl = int(m.group(1)) if m else 1
            lines.append("#" * min(lvl + 1, 6) + " " + t)
        else:
            lines.append(t)
    # 表格
    for ti, tbl in enumerate(d.tables, 1):
        rows = []
        for r in tbl.rows:
            cells = [c.text.strip().replace("\n", " ") for c in r.cells]
            rows.append(cells)
        if not rows:
            continue
        width = max(len(r) for r in rows)
        lines.append(f"\n### 表 {ti}\n")
        for ri, r in enumerate(rows):
            r = r + [""] * (width - len(r))
            lines.append("| " + " | ".join(r) + " |")
            if ri == 0:
                lines.append("|" + "---|" * width)
    return "\n".join(lines), {"paragraphs": len(d.paragraphs), "tables": len(d.tables)}


def docx_images(src, outdir, prefix, min_px):
    """docx 本质是 zip，图片位于 word/media/"""
    import zipfile
    from PIL import Image

    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    saved = []
    with zipfile.ZipFile(src) as z:
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        for n in sorted(media):
            data = z.read(n)
            name = f"{prefix}-{Path(n).name}"
            try:
                im = Image.open(io.BytesIO(data))
                if min(im.size) < min_px:
                    continue
                size = im.size
            except Exception:
                size = (0, 0)
            (outdir / name).write_bytes(data)
            saved.append((name, size[0], size[1], 0))
    return saved


# ---------------------------------------------------------------- PPTX
def pptx_text(src):
    import zipfile

    lines = []
    with zipfile.ZipFile(src) as z:
        slides = sorted(
            [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
            key=lambda n: int(re.search(r"(\d+)", n.split("/")[-1]).group(1)),
        )
        for n in slides:
            xml = z.read(n).decode("utf-8", "ignore")
            texts = re.findall(r"<a:t>(.*?)</a:t>", xml, re.S)
            texts = [re.sub(r"<[^>]+>", "", t).strip() for t in texts]
            texts = [t for t in texts if t]
            if not texts:
                continue
            no = re.search(r"(\d+)", n.split("/")[-1]).group(1)
            lines.append(f"\n\n### 幻灯片 {no}\n")
            lines.extend(texts)
    return "\n".join(lines).strip(), {"slides": len(slides)}


def zip_images(src, outdir, prefix, min_px, inner_dir):
    import zipfile
    from PIL import Image

    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    saved = []
    with zipfile.ZipFile(src) as z:
        for n in sorted(x for x in z.namelist() if x.startswith(inner_dir)):
            data = z.read(n)
            if not re.search(r"\.(png|jpe?g|gif|webp|emf|wmf)$", n, re.I):
                continue
            name = f"{prefix}-{Path(n).name}"
            try:
                im = Image.open(io.BytesIO(data))
                w, h = im.size
            except Exception:
                w, h = 0, 0
            if w and min(w, h) < min_px:
                continue
            (outdir / name).write_bytes(data)
            saved.append((name, w, h, 0))
    return saved


# ---------------------------------------------------------------- XLSX
def xlsx_text(src, max_rows=200):
    import openpyxl

    wb = openpyxl.load_workbook(src, data_only=True)
    lines = []
    for ws in wb.worksheets:
        lines.append(f"\n\n## 工作表：{ws.title}\n")
        for ri, row in enumerate(ws.iter_rows(values_only=True)):
            if ri > max_rows:
                lines.append(f"…（已截断，共 {ws.max_row} 行）")
                break
            cells = ["" if c is None else str(c).replace("\n", " ").strip() for c in row]
            while cells and cells[-1] == "":
                cells.pop()
            if not cells:
                continue
            lines.append("| " + " | ".join(cells) + " |")
            if ri == 0:
                lines.append("|" + "---|" * len(cells))
    wb.close()
    return "".join(lines).strip(), {}


# ---------------------------------------------------------------- HTML
IMG_RE = re.compile(r"""<img[^>]+?(?:data-src|src)\s*=\s*["']([^"']+)["']""", re.I)


def html_images(src):
    raw = Path(src).read_bytes()
    for enc in ("utf-8", "gbk", "gb18030", "latin-1"):
        try:
            html = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    urls = []
    for m in IMG_RE.finditer(html):
        u = m.group(1).strip()
        if u.startswith("//"):
            u = "https:" + u
        u = u.replace("&amp;", "&")
        if not u.startswith("http"):
            continue
        # 过滤装饰性资源
        if "res.wx.qq.com" in u or "pic_blank" in u:
            continue
        if u not in urls:
            urls.append(u)
    return "\n".join(urls), {"count": len(urls)}


def html_article(src, prefix="art", img_subdir="images"):
    """把微信公众号文章 HTML 转为 Markdown 草稿，图片按 DOM 顺序插入占位路径。

    返回 (markdown, [(序号, 原始url)])
    """
    from bs4 import BeautifulSoup

    raw = Path(src).read_bytes()
    for enc in ("utf-8", "gbk", "gb18030", "latin-1"):
        try:
            html = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    soup = BeautifulSoup(html, "lxml")
    root = soup.find(id="js_content") or soup.find("div", class_="rich_media_content") or soup.body
    if root is None:
        return "", []

    imgs = []
    idx = {"n": 0}

    def img_tag(tag):
        u = (tag.get("data-src") or tag.get("src") or "").strip()
        if u.startswith("//"):
            u = "https:" + u
        u = u.replace("&amp;", "&")
        if not u.startswith("http") or "res.wx.qq.com" in u or "pic_blank" in u:
            return None
        idx["n"] += 1
        n = idx["n"]
        imgs.append((n, u))
        return f"\n\n![{prefix}-{n:02d}]({img_subdir}/{prefix}-{n:02d}.jpg)\n\n"

    lines = []
    tags = root.find_all(["h1", "h2", "h3", "h4", "p", "section", "li", "table", "img", "br"], recursive=True)
    for t in tags:
        if t.name == "img":
            s = img_tag(t)
            if s:
                lines.append(s)
            continue
        if t.name in ("h1", "h2", "h3", "h4"):
            txt = t.get_text(" ", strip=True)
            if txt:
                lvl = {"h1": "##", "h2": "###", "h3": "####", "h4": "#####"}[t.name]
                lines.append(f"\n{lvl} {txt}\n")
            continue
        if t.name == "table":
            rows = []
            for tr in t.find_all("tr"):
                cells = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
                if any(cells):
                    rows.append(cells)
            if rows:
                width = max(len(r) for r in rows)
                lines.append("")
                for ri, r in enumerate(rows):
                    r = r + [""] * (width - len(r))
                    lines.append("| " + " | ".join(r) + " |")
                    if ri == 0:
                        lines.append("|" + "---|" * width)
                lines.append("")
            continue
        txt = t.get_text(" ", strip=True)
        if not txt:
            continue
        if lines and lines[-1].strip() == txt:
            continue
        lines.append(txt)

    md = "\n\n".join(x.strip() for x in lines if x.strip())
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md, imgs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["text", "images", "render", "html-img", "html-article"])
    ap.add_argument("src")
    ap.add_argument("--out", default="")
    ap.add_argument("--outdir", default="")
    ap.add_argument("--prefix", default="img")
    ap.add_argument("--pages", default="")
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--min-px", type=int, default=MIN_PX_DEFAULT)
    a = ap.parse_args()

    ext = Path(a.src).suffix.lower()

    if a.cmd == "text":
        if ext == ".pdf":
            text, meta = pdf_text(a.src, a.pages)
        elif ext in (".docx",):
            text, meta = docx_text(a.src)
        elif ext == ".pptx":
            text, meta = pptx_text(a.src)
        elif ext in (".xlsx", ".xlsm"):
            text, meta = xlsx_text(a.src)
        else:
            log(f"[warn] 不支持直接抽取的类型：{ext}")
            text, meta = "", {"unsupported": ext}
        if a.out:
            write_text(a.out, text)
            print(f"[text] {a.out} chars={len(text)} {meta}")
        else:
            sys.stdout.write(text)
        return

    if a.cmd == "html-img":
        urls, meta = html_images(a.src)
        if a.out:
            write_text(a.out, urls)
            print(f"[html-img] {a.out} {meta}")
        else:
            print(urls)
        return

    if a.cmd == "html-article":
        md, imgs = html_article(a.src, a.prefix)
        if a.out:
            write_text(a.out, md)
        if a.outdir:
            write_text(a.outdir, "\n".join(f"{n:02d}\t{u}" for n, u in imgs))
        print(f"[html-article] md_chars={len(md)} images={len(imgs)}")
        return

    if a.cmd == "images":
        assert a.outdir, "--outdir 必填"
        if ext == ".pdf":
            saved = pdf_images(a.src, a.outdir, a.prefix, a.min_px)
        elif ext == ".docx":
            saved = docx_images(a.src, a.outdir, a.prefix, a.min_px)
        elif ext == ".pptx":
            saved = zip_images(a.src, a.outdir, a.prefix, a.min_px, "ppt/media/")
        else:
            saved = []
            log(f"[warn] 不支持抽取内嵌图片的类型：{ext}")
        lines = [f"{n}\t{w}x{h}\tp{p}" for n, w, h, p in saved]
        if a.out:
            write_text(a.out, "\n".join(lines))
        print(f"[images] {len(saved)} -> {a.outdir}")
        for l in lines:
            log("  " + l)
        return

    if a.cmd == "render":
        assert a.outdir, "--outdir 必填"
        saved = pdf_render(a.src, a.outdir, a.pages, a.dpi, a.prefix)
        for n, w, h in saved:
            log(f"  {n} {w}x{h}")
        print(f"[render] {len(saved)} -> {a.outdir}")
        return


if __name__ == "__main__":
    main()
