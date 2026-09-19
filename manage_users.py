"""
MkDocs 站点用户管理工具
用 JSON + SHA-256 加盐哈希管理账号密码，比 CSV 更安全更方便。

用法:
  python manage_users.py add    <用户名> <密码> [角色]   添加用户（角色: user/admin，默认 user）
  python manage_users.py remove <用户名>                 删除用户
  python manage_users.py list                            列出所有用户
  python manage_users.py passwd  <用户名> <新密码>        修改密码
  python manage_users.py setrole <用户名> <角色>          修改角色（user/admin）

角色说明:
  user   普通账户：可浏览常规内容，不显示"维护指南"，不能编辑页面/查看网页源代码
  admin  管理员账户：拥有全部权限

示例:
  python manage_users.py add zhangsan mySecret123
  python manage_users.py add admin1 adminPass456 admin
  python manage_users.py setrole zhangsan admin
  python manage_users.py list
  python manage_users.py passwd zhangsan newPass456
  python manage_users.py remove zhangsan
"""

import hashlib
import json
import os
import secrets
import sys

# Windows 控制台 UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

USERS_FILE = os.path.join("docs", "javascripts", "users.json")

VALID_ROLES = ("user", "admin")


def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(data):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def hash_password(salt, password):
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def cmd_add(username, password, role="user"):
    if role not in VALID_ROLES:
        print(f"[x] 无效角色 '{role}'，可选: {'/'.join(VALID_ROLES)}")
        sys.exit(1)
    data = load_users()
    if any(u["username"] == username for u in data["users"]):
        print(f"[x] 用户 '{username}' 已存在")
        sys.exit(1)
    salt = secrets.token_hex(16)
    data["users"].append({
        "username": username,
        "salt": salt,
        "password_hash": hash_password(salt, password),
        "role": role
    })
    save_users(data)
    print(f"[ok] 已添加用户 '{username}'（角色: {role}）")


def cmd_remove(username):
    data = load_users()
    before = len(data["users"])
    data["users"] = [u for u in data["users"] if u["username"] != username]
    if len(data["users"]) == before:
        print(f"[x] 用户 '{username}' 不存在")
        sys.exit(1)
    save_users(data)
    print(f"[ok] 已删除用户 '{username}'")


def cmd_list():
    data = load_users()
    if not data["users"]:
        print("（暂无用户）")
        return
    print(f"共 {len(data['users'])} 个用户:")
    for u in data["users"]:
        role = u.get("role", "user")
        print(f"  - {u['username']}  （角色: {role}）")


def cmd_passwd(username, new_password):
    data = load_users()
    user = next((u for u in data["users"] if u["username"] == username), None)
    if not user:
        print(f"[x] 用户 '{username}' 不存在")
        sys.exit(1)
    salt = secrets.token_hex(16)
    user["salt"] = salt
    user["password_hash"] = hash_password(salt, new_password)
    save_users(data)
    print(f"[ok] 已修改用户 '{username}' 的密码")


def cmd_setrole(username, role):
    if role not in VALID_ROLES:
        print(f"[x] 无效角色 '{role}'，可选: {'/'.join(VALID_ROLES)}")
        sys.exit(1)
    data = load_users()
    user = next((u for u in data["users"] if u["username"] == username), None)
    if not user:
        print(f"[x] 用户 '{username}' 不存在")
        sys.exit(1)
    user["role"] = role
    save_users(data)
    print(f"[ok] 已将用户 '{username}' 的角色修改为 '{role}'")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "add":
        if len(sys.argv) not in (4, 5):
            print("用法: python manage_users.py add <用户名> <密码> [角色]")
            sys.exit(1)
        role = sys.argv[4] if len(sys.argv) == 5 else "user"
        cmd_add(sys.argv[2], sys.argv[3], role)
    elif cmd == "remove":
        if len(sys.argv) != 3:
            print("用法: python manage_users.py remove <用户名>")
            sys.exit(1)
        cmd_remove(sys.argv[2])
    elif cmd == "list":
        cmd_list()
    elif cmd == "passwd":
        if len(sys.argv) != 4:
            print("用法: python manage_users.py passwd <用户名> <新密码>")
            sys.exit(1)
        cmd_passwd(sys.argv[2], sys.argv[3])
    elif cmd == "setrole":
        if len(sys.argv) != 4:
            print("用法: python manage_users.py setrole <用户名> <角色>")
            sys.exit(1)
        cmd_setrole(sys.argv[2], sys.argv[3])
    else:
        print(f"未知命令: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
