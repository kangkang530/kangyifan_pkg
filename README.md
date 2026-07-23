# 汽车总布置知识库

> 面向汽车设计与总布置方向的系统性知识库，涵盖整车参数、动力总成、底盘、车身、电气系统布置及实战案例。

## 项目简介

这是一个基于 **MkDocs Material** 构建的汽车总布置知识网站，目标读者包括：

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
git clone https://github.com/your-username/auto-layout-kb.git
cd auto-layout-kb
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

```bash
mkdocs serve
```

访问 **http://127.0.0.1:8000** 即可预览。

## 内容板块

| 板块 | 内容 |
|------|------|
| 总布置基础 | 概述、工作流程、工程师职责、法规标准 |
| 整车参数 | 尺寸参数、质量参数、性能参数 |
| 动力总成布置 | 发动机布置、电机布置、传动系统 |
| 底盘系统布置 | 悬架、转向、制动 |
| 车身布置 | 乘员舱、人机工程、行李储物 |
| 电气与新能源 | 线束、电池、热管理 |
| 总布置案例 | 燃油轿车、SUV/MPV、纯电动平台 |
| 工具与资源 | 软件工具、学习资源、职业发展 |
| 维护指南 | 内容更新、部署发布、本地开发 |

## 目录结构

```
auto-layout-kb/
├── docs/                    # 内容目录（Markdown 文件）
│   ├── index.md            # 首页
│   ├── basics/             # 总布置基础
│   ├── parameters/         # 整车参数
│   ├── powertrain/         # 动力总成
│   ├── chassis/            # 底盘系统
│   ├── body/               # 车身布置
│   ├── electrical/         # 电气与新能源
│   ├── cases/              # 总布置案例
│   ├── tools/              # 工具与资源
│   ├── maintain/           # 维护指南
│   └── stylesheets/        # 自定义样式
├── mkdocs.yml              # MkDocs 配置文件
├── requirements.txt        # Python 依赖
└── README.md               # 项目说明
```

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

## 许可证

本知识库内容仅供学习参考，具体设计参数请以最新版标准原文和工程实际为准。

## 联系

- 发现错误或有建议？请提交 [Issue](https://github.com/your-username/auto-layout-kb/issues)
- 欢迎贡献内容，提交 Pull Request

---

*持续更新中*
