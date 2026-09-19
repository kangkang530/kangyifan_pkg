# 乘用车上车体总布置知识库

> 面向汽车设计与总布置方向的系统性知识库，涵盖上车体总布置基础、整车参数、IP&CNSL、门板立柱顶棚、前后端区域、人机舒适性、整车断面与整车开发流程。

## 项目简介

这是一个基于 **MkDocs Material** 构建的乘用车上车体总布置知识网站，目标读者包括：

- 汽车设计/总布置方向的在校学生
- 初级总布置工程师
- 想转行或自学汽车设计的人
- 作为个人知识备份和输出

## 技术栈

| 技术 | 说明 |
|------|------|
| **MkDocs** | Python 静态站点生成器 |
| **Material for MkDocs** | 现代美观的文档主题 |
| **Markdown** | 内容编写格式 |
| **Git** | 版本管理 |
| **GitHub Pages** | 免费部署方案 |

> 选择 MkDocs 而非 Hugo/Jekyll 的原因：基于 Python，后期可无缝扩展为 Python Web 应用（Flask/FastAPI）。

## 快速开始

### 1. 环境要求

- Python 3.8+
- Git

### 2. 克隆项目

```bash
git clone https://github.com/kangkang530/kangyifan_pkg.git
cd kangyifan_pkg
```

### 3. 创建虚拟环境

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. 安装依赖

```bash
# 使用国内镜像加速（推荐）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 5. 启动本地预览

本项目是 **MkDocs Material** 静态站点，提供两种启动方式，任选其一。

> 访问地址注意带站点子目录：**http://127.0.0.1:8000/kangyifan_pkg/**（`mkdocs.yml` 中 `site_url` 含 `/kangyifan_pkg/` 子路径）

#### 方式一：双击脚本启动（推荐）

直接双击项目根目录的 `启动本地预览.bat`，脚本会自动完成以下步骤：

1. 选择 Python 解释器：优先使用项目虚拟环境 `.venv\Scripts\python.exe`，不存在时回退到系统 `PATH` 中的 `python`
2. 检测 `mkdocs` 是否已安装，未安装则自动执行 `pip install -r requirements.txt`（走清华镜像）
3. 检测 `8000` 端口是否已有服务在运行，没有则以最小化窗口启动预览服务
4. 自动在浏览器中打开预览页面

停止预览：关闭任务栏中那个最小化的 `MkDocs预览服务(关闭此窗口即停止)` 窗口即可。

#### 方式二：手动命令行启动

```bat
:: Windows，进入项目根目录
cd /d <项目根目录>

:: 1. 激活虚拟环境（若尚未创建，见上文"创建虚拟环境"）
.venv\Scripts\activate

:: 2. 启动预览服务
mkdocs serve -a 127.0.0.1:8000
```

不激活虚拟环境时，也可以直接调用虚拟环境内的解释器：

```bat
.venv\Scripts\python.exe -m mkdocs serve -a 127.0.0.1:8000
```

macOS / Linux：

```bash
source .venv/bin/activate
mkdocs serve -a 127.0.0.1:8000
```

停止预览：在命令行窗口按 `Ctrl + C`。

#### 常用参数与说明

| 场景 | 命令 |
|------|------|
| 默认预览 | `mkdocs serve` |
| 端口被占用时换端口 | `mkdocs serve -a 127.0.0.1:8080` |
| 构建静态文件到 `site/` | `mkdocs build` |
| 清理旧文件后构建 | `mkdocs build --clean` |
| 查看版本 | `mkdocs --version` |

- 支持热重载：修改 `docs/` 下的 `.md` 文件并保存后，浏览器页面会自动刷新
- 若预览打不开：先确认 `8000` 端口是否被占用，或改用其他端口
- 若提示找不到 `mkdocs`：确认虚拟环境已激活，或重新安装依赖

```bat
.venv\Scripts\python.exe -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 内容板块

| 板块 | 内容 |
|------|------|
| 上车体总布置基础 | 概述、工作流程、工程师职责、法规标准 |
| 整车参数 | 尺寸参数、质量参数、性能参数、对标数据库 |
| IP&CNSL 区域总布置 | IP 布置、CNSL 布置、校核标准 |
| 门板&立柱&顶棚区域总布置 | 门板、立柱、顶棚布置及校核标准 |
| 前后端区域总布置 | 前端区域、后端区域、校核标准 |
| 人机舒适性标准 | 坐姿与 H 点、操作可达性、视野校核、空间与进出便利性 |
| 整车断面 | 断面开发流程、设计方法、典型断面清单 |
| 整车开发流程 | 流程概述、关键里程碑、阶段交付物 |
| 工具与资源 | 软件工具、学习资源、职业发展 |
| 维护指南 | 内容更新、部署发布、本地开发 |

> 各内容子页面已搭建统一框架（页面标题 + 核心模块 + 要点/示例/注意事项占位），正文内容将持续逐块填充。

## 目录结构

```
kangyifan_pkg/
├── docs/                    # 内容目录（Markdown 文件）
│   ├── index.md            # 首页
│   ├── basics/             # 上车体总布置基础
│   ├── parameters/         # 整车参数
│   ├── ip-cnsl/            # IP&CNSL 区域总布置
│   ├── door-trim/          # 门板&立柱&顶棚区域总布置
│   ├── front-rear/         # 前后端区域总布置
│   ├── ergonomics/         # 人机舒适性标准
│   ├── sections/           # 整车断面
│   ├── process/            # 整车开发流程
│   ├── tools/              # 工具与资源
│   ├── maintain/           # 维护指南
│   ├── javascripts/        # 自定义脚本（登录认证、对标数据库）
│   └── stylesheets/        # 自定义样式
├── mkdocs.yml              # MkDocs 配置文件
├── manage_users.py         # 站点账号管理工具
├── requirements.txt        # Python 依赖
└── README.md               # 项目说明
```

> 各板块目录下均含 `images/` 子目录用于存放配图，在对应 `.md` 文件中以相对路径引用。

## 账号与权限

站点除首页外需登录后访问，账号分为两级：

| 角色 | 权限 |
|------|------|
| 普通用户（`user`） | 浏览常规内容；不显示"维护指南"栏目，不显示编辑/查看源码按钮 |
| 管理员（`admin`） | 全部权限 |

账号通过 `manage_users.py` 管理（JSON 存储 + SHA-256 加盐哈希）：

```bash
python manage_users.py add <用户名> <密码> [角色]   # 添加用户（角色默认 user）
python manage_users.py setrole <用户名> <角色>       # 修改角色（user/admin）
python manage_users.py passwd <用户名> <新密码>      # 修改密码
python manage_users.py remove <用户名>               # 删除用户
python manage_users.py list                          # 列出所有用户及角色
```

> 静态站点为客户端软门槛认证，仅提供基础保护；如需严格访问控制，请使用服务端认证方案（Nginx + Flask/FastAPI）。

## 日常维护

### 添加新内容

1. 在 `docs/` 对应目录创建 `.md` 文件
2. 在 `mkdocs.yml` 的 `nav` 中注册
3. 本地预览确认
4. 提交并推送

详细说明见 [内容更新指南](docs/maintain/update.md)。

### 部署到线上

推荐使用 GitHub Pages 免费部署，配置 GitHub Actions 后可自动部署。

详细说明见 [部署发布指南](docs/maintain/deploy.md)。

## 后期扩展

本项目基于 Python (MkDocs)，后期可扩展为 Python Web 应用：

- 增加 Flask/FastAPI 后端
- 动态内容管理
- 用户系统
- API 接口

详细说明见 [本地开发指南](docs/maintain/develop.md)。

## 更新日志

### 2026-08-30

- **板块重构**：站点主题调整为"乘用车上车体总布置"，知识板块重组为 9 个（见上方内容板块表）；31 个子页面搭建统一框架（页面标题 + 核心模块 + 要点/示例/注意事项占位），后续逐块填充正文
- **账号分级**：新增普通用户/管理员两级账号体系；普通用户不显示"维护指南"及编辑/查看源码按钮，直接访问维护指南页面自动跳回首页；`manage_users.py` 支持角色管理与快速增删账号
- **图片支持**：各板块目录新增 `images/` 子目录，板块首页已接入占位示意图（同名替换即可生效）
- **修复**：修正 `basics/overview.md` 中因全角括号导致的失效超链接
- **配置**：`mkdocs.yml` 站点名称、描述与导航（nav）全面更新
- **待清理**：旧目录 `powertrain/`、`chassis/`、`body/`、`electrical/`、`cases/` 已从导航移除，暂保留在磁盘中，确认后可删除

## 许可证

本知识库内容仅供学习参考，具体设计参数请以最新版标准原文和工程实际为准。

## 联系

- 发现错误或有建议？请提交 [Issue](https://github.com/kangkang530/kangyifan_pkg/issues)
- 欢迎贡献内容，提交 Pull Request

---

*持续更新中*
