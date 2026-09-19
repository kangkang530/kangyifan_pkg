"""
检查当前 Python 环境是否满足 requirements.txt 中的依赖要求。
在 VSCode 中直接运行此脚本即可（F5 或右上角运行按钮）。

优先检查项目 .venv 虚拟环境；若不存在则检查当前解释器。
"""

import os
import re
import sys
import subprocess
from importlib.metadata import version, PackageNotFoundError

# Windows 控制台默认 GBK，强制 UTF-8 以正确显示中文与符号
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


REQUIREMENTS_FILE = "requirements.txt"
VENV_DIR = ".venv"

# 支持的版本比较操作符（按长度降序匹配，避免 >= 被 > 误匹配）
OPERATORS = [">=", "<=", "==", "!=", "~=", ">", "<"]


def parse_requirement_line(line: str):
    """
    解析 requirements.txt 的一行，返回 (包名, 操作符, 期望版本) 或 None。
    忽略注释、空行、选项行（如 -i ...）。
    """
    line = line.strip()
    if not line or line.startswith("#") or line.startswith("-"):
        return None

    # 去掉行内注释
    if " #" in line:
        line = line.split(" #", 1)[0].strip()

    # 去掉 extras（如 package[extra]）和环境标记（如 ; python_version<"3.10"）
    line = line.split(";")[0].strip()
    package_part = re.split(r"\[", line, 1)[0].strip()

    # 尝试匹配 操作符
    for op in OPERATORS:
        if op in package_part:
            name, _, ver = package_part.partition(op)
            return name.strip(), op, ver.strip()

    # 无操作符，只检查包是否存在
    return package_part, None, None


def get_installed_version(package_name: str):
    """返回已安装版本号，未安装返回 None。"""
    try:
        return version(package_name)
    except PackageNotFoundError:
        return None


def version_tuple(v: str):
    """把 '1.6.0' 转成 (1, 6, 0)，便于比较。非数字部分按 0 处理。"""
    parts = []
    for p in re.split(r"[.\-+]", v):
        m = re.match(r"\d+", p)
        parts.append(int(m.group()) if m else 0)
    return tuple(parts)


def compare(installed: str, op: str, expected: str) -> bool:
    """比较已安装版本与期望版本是否满足操作符。"""
    a, b = version_tuple(installed), version_tuple(expected)
    # 补齐长度
    n = max(len(a), len(b))
    a = a + (0,) * (n - len(a))
    b = b + (0,) * (n - len(b))

    if op == ">=":
        return a >= b
    if op == "<=":
        return a <= b
    if op == "==":
        return a == b
    if op == "!=":
        return a != b
    if op == ">":
        return a > b
    if op == "<":
        return a < b
    if op == "~=":
        # 兼容版本：主.次 必须相同，修订 >=
        if len(b) < 2:
            return a >= b
        return a[: len(b) - 1] == b[: len(b) - 1] and a >= b
    return False


def main():
    # 若存在 .venv 且当前解释器不是 venv 的 python，则用 venv 重新运行本脚本
    venv_python = os.path.join(VENV_DIR, "Scripts", "python.exe")
    if os.path.isabs(VENV_DIR) is False:
        venv_python = os.path.join(os.getcwd(), VENV_DIR, "Scripts", "python.exe")
    if os.path.exists(venv_python) and os.path.normcase(venv_python) != os.path.normcase(sys.executable):
        print(f"[提示] 检测到虚拟环境 {VENV_DIR}，切换至该环境检查依赖...\n")
        os.execv(venv_python, [venv_python, os.path.abspath(__file__)])

    try:
        # utf-8-sig 会自动剥离文件首部的 BOM（若有），对无 BOM 文件同样兼容
        with open(REQUIREMENTS_FILE, "r", encoding="utf-8-sig") as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"[错误] 未找到 {REQUIREMENTS_FILE}，请确认脚本运行目录正确。")
        sys.exit(1)

    print("=" * 60)
    print(f"Python: {sys.version.split()[0]}  ({sys.executable})")
    print(f"检查文件: {REQUIREMENTS_FILE}")
    print("=" * 60)

    all_ok = True
    missing = []
    outdated = []
    satisfied = []

    for line in lines:
        parsed = parse_requirement_line(line)
        if parsed is None:
            continue
        name, op, expected = parsed

        installed = get_installed_version(name)
        if installed is None:
            all_ok = False
            missing.append((name, op, expected))
            continue

        if op is None:
            satisfied.append((name, installed, None))
            continue

        if compare(installed, op, expected):
            satisfied.append((name, installed, f"{op}{expected}"))
        else:
            all_ok = False
            outdated.append((name, installed, op, expected))

    # 输出结果
    if satisfied:
        print("\n[满足] 已安装且版本符合要求:")
        for name, ver, req in satisfied:
            req_str = f" ({req})" if req else ""
            print(f"  ✓ {name:<45} {ver}{req_str}")

    if outdated:
        print("\n[版本不符] 已安装但版本不满足要求:")
        for name, ver, op, exp in outdated:
            print(f"  ✗ {name:<45} 已装 {ver}  需要 {op}{exp}")

    if missing:
        print("\n[缺失] 未安装的包:")
        for name, op, exp in missing:
            req_str = f"{op}{exp}" if op else "(无版本要求)"
            print(f"  ✗ {name:<45} 需要 {req_str}")

    print("\n" + "=" * 60)
    if all_ok:
        print("结果: 环境满足 requirements.txt 的全部要求。")
    else:
        print("结果: 环境不满足要求，请执行以下命令安装/更新依赖:")
        print('  pip install -r requirements.txt '
              '-i https://pypi.tuna.tsinghua.edu.cn/simple')
        sys.exit(2)


if __name__ == "__main__":
    main()
