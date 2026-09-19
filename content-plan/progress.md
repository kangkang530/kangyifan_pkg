# 内容填充进度与取材映射

> 本文件是本项目的**过程管理台账**：记录每个页面的状态、取材来源与遗留项。
> 状态机：`pending` → `sourced`（已拉取素材）→ `drafted`（已回填正文）→ `checked`（通过 site-check）→ `done`。
> 素材目录：`.ima-cache/`（原始文件与抽取文本）；配图落到 `docs/<板块>/images/`。
> 验收命令：`python site-check.py --http`

## 一、知识来源基线

| 来源 | 位置 | 条目数 | 可用性 |
|---|---|---|---|
| 个人知识库「布球人的知识库」 | 文件夹 **总布置**（含子夹「阿尔特设计标准」「通用汽车设计标准」） | 100+ | 企业规范 PDF 多为**文本可抽取**；部分为**扫描版** |
| 个人知识库「布球人的知识库」 | 文件夹 **汽车** | 91 | 全部为微信公众号文章，**多为纯图片型**，需视觉识别 |
| 共享知识库「汽车行业知识库」 | 根目录 | 306 | 行业通识，作为补充 |
| 站点根目录既存底稿 | `上车体总布置基础.md` | 1 | 已整合的《总布置》成果，作为**文风与事实基准** |

完整条目清单（含 media_id）见 `content-plan/kb-inventory.txt`。

### 取材优先级规则（2026-09-16 追加）

| 优先级 | 来源 | 说明 |
|---|---|---|
| **P1** | **SJ 系列**（阿尔特设计标准，50+ 份 PDF） | 企业设计指导书/校核规范，**PDF 有文本层**、条款密度最高、含公式与表格 |
| **P1** | **GM 系列**（通用汽车设计标准，50+ 份 PDF） | 英文人机/操作件标准（U/T/Q/R/S/W/X 系列），人机与操作件章节的优秀补充 |
| **P2** | QCD / EDD 系列（阶段检查规范与清单） | 阶段门禁与检查项，条款式结构清晰 |
| **P2** | H20 项目 `.docx` / `.xlsx` / `.pptx` 报告 | 真实项目数据、图表丰富（PPT 内嵌图是优质图源） |
| **P3** | 微信文章（「汽车」文件夹，91 篇） | 多为**纯图片型**，仅作补充图源与线索 |
| **禁用** | **所有 `AEM-` 开头文件** | 读取存在问题，**不采用**；改由 P1/P2 中的等价内容替代 |

> 知识库内容存在大量重复：同一设计要点常同时出现在 `AEM-`、`SJ-`、`QCD-` 与 H20 项目中。
> 因此遇到 `AEM-` 时**不做降级处理**，而是回到 SJ/QCD/EDD/H20 中找等价条款。

## 二、页面台账

| # | 页面 | 状态 | 主要取材 | 配图 |
|---|---|---|---|---|
| 1 | index.md | done | 站点导航结构 | Mermaid 脑图 |
| 2 | basics/overview.md | drafted | 既有正文 + H20 上车体构想 | 待补 |
| 3 | **basics/workflow.md** | **done（试点）** | QCD-A0-005、QCD-A0-006、H20 硬点报告 | QCD-A0-005 p4/p6、QCD-A0-006 p1/p2 |
| 4 | basics/responsibilities.md | pending | AEM-A0-003、整车部设计手册-附件系统布置 | |
| 5 | basics/standards.md | pending | SAE J1100 中文版、GB 清单、企业编码体系 | SAE J1100 目录页 |
| 6 | parameters/dimensions.md | pending | AEM-A1-001 外廓尺寸设定、ZBZ 标杆车外轮廓报告 | ZBZ 报告图 |
| 7 | parameters/mass.md | pending | AEM-A0-102 整车质量参数估算、AEM-A0-005 轴荷测量、H20 BOM | 轴荷测量示意 |
| 8 | parameters/performance.md | pending | AEM-A1-101 动力总成选型 | |
| 9 | parameters/benchmark.md | pending | ZBZ 标杆车两份报告、benchmark.json | — |
| 10 | **ip-cnsl/ip.md** | **done（批次 3）** | SJ 46-2009、SJ 47-2009、SJ 50-2009、SJ 48-2009、SJ 8-2008、SJ 6-2008、GM U02/S00 | sj46-p08/p15/p27、sj47-p06/p07、sj08-p06、gm-u02-p01 |
| 11 | **ip-cnsl/cnsl.md** | **done（批次 3）** | SJ 46-2009 §6.13~6.15、SJ 6-2008、SJ 15-2008、QCD-A0-005、GM S00/U02 | sj46-p25、gm-s00-p01 |
| 12 | **ip-cnsl/check.md** | **done（批次 3）** | SJ 46-2009、SJ 47-2009、SJ 8-2008、SJ 39-2009、SJ 50-2009、SJ 9/15 | sj46-p08/p25、sj08-p08 |
| 13 | door-trim/door.md | pending | AEM-A1-501 门洞尺寸、AEM-A1-502 门开度、SJ 车门设计/主断面 | 微信图（开闭件设计指南） |
| 14 | door-trim/pillar.md | pending | SJ 20 立柱内饰板、SJ 54 侧碰 B 柱断面、汽车密封条设计指南 | 微信图 |
| 15 | door-trim/roof.md | pending | SJ 18 顶蓬、天窗总成设计指南、顶棚设计要求 | 微信图（天窗 34 图） |
| 16 | door-trim/check.md | pending | SJ 21 前门内饰板、AEM-A5-107/108 内外扣手 | |
| 17 | **front-rear/front.md** | **done（批次 5）** | SJ 24-2008、SJ 44-2009、SJ 19-2008、SJ 36-2009、SJ 5-2009 | sj24-p11/p12、sj44-p08 |
| 18 | **front-rear/rear.md** | **done（批次 5）** | SJ 24-2008、SJ 53-2010、SJ 32-2009、SJ 44-2009 | sj24-p09、sj53-p07 |
| 19 | **front-rear/check.md** | **done（批次 5）** | SJ 24-2008、SJ 44-2009、SJ 32-2009、SJ 53-2010、SJ 19-2008、SJ 51-2009 | sj44-p08/p09、sj32-p07 |
| 20 | **ergonomics/posture.md** | **done（批次 2）** | SJ 6-2008、SJ 7-2008、SJ 9-2008、SJ 26-2008、QCD-A0-005 | sj06-p05、sj06-p07、sj09-p10 |
| 21 | **ergonomics/reach.md** | **done（批次 2）** | SJ 15-2008、SJ 6-2008、QCD-A0-005 | sj15-p05、sj06-p07 |
| 22 | **ergonomics/vision.md** | **done（批次 2）** | SJ 7-2008、SJ 14-2008、SJ 5-2009、SJ 9-2008 | sj07-p06、sj07-p08、sj14-p07 |
| 23 | **ergonomics/comfort.md** | **done（批次 2）** | SJ 9-2008、SJ 18-2008、SJ 26-2008、SJ 52-2009、QCD-A0-005 | sj18-p09、sj52-p07 |
| 24 | sections/process.md | pending | AEM-A0-010 整车坐标系、40《总布置图设计规范》 | 坐标系示意 |
| 25 | sections/method.md | pending | EDD 检查清单、SJ 40 外饰 SEG、SJ 4 车门主断面 | 断面图 |
| 26 | sections/library.md | pending | SJ 4/25/40/46/54 等断面清单 | |
| 27 | process/overview.md | pending | 【技研】最详细的整车开发流程、福特 GPDS 教程 | 微信图 |
| 28 | process/milestones.md | pending | QCD-A0-005/006 门禁、H20 项目节点 | |
| 29 | process/deliverables.md | pending | H20 硬点报告目录、AEM-A0-003 | |
| 30 | tools/software.md | pending | CATIA 玻璃面拟合（微信）、pycatia 文件夹 | 微信图 |
| 31 | tools/learning.md | pending | 企业编码体系表（见 `上车体总布置基础.md`） | |
| 32 | tools/career.md | pending | 行业通识 + 汽车行业知识库 | |
| 33 | maintain/update.md | done | 既有正文 | 已有 |
| 34 | maintain/deploy.md | done | 既有正文 | 已有 |
| 35 | maintain/develop.md | done | 既有正文 | 已有 |
| 36 | about.md | done | 既有正文 | |

## 三、单页处理 SOP

1. **定位来源**：按上表在 `content-plan/kb-inventory.txt` 中查 media_id（企业规范优先于微信文章）。
2. **拉取**：`node ima-tool.cjs pull <media_id> .ima-cache --name=<简短名>`
3. **抽取**：
   - 文本：`python kb-extract.py text .ima-cache/x.pdf --out=.ima-cache/x.txt`
   - 配图（PDF 按页渲染，语义可靠）：`python kb-extract.py render .ima-cache/x.pdf --outdir=docs/<板块>/images --pages=4,6 --prefix=<规范编号>`
   - Word/PPT 内嵌图：`python kb-extract.py images .ima-cache/x.docx --outdir=.ima-cache/img-x --prefix=x`
   - 微信文章：先带 UA 抓 HTML，再 `html-article` 转 Markdown + 图片顺序映射
4. **回填**：只替换 `*待补充：…*` 锚点与 `!!! info "页面状态"`；保留原有 H2/H3 骨架。
5. **脑图**：在页面首部加一个 ` ```mermaid mindmap ` 块，节点来自知识库的实际结构。
6. **无据即占位**：检索不到的槽位改写为
   `!!! warning "待人工补充"`「已检索关键词 + 建议补充来源文件编号」。
7. **验收**：`python site-check.py --http` → 图/链 0 失效、HTTP 全 200。

## 二之二、全部批次完成情况（2026-09-17 收口）

| 批次 | 页面 | 状态 |
|---|---|---|
| 批次 1 | `basics/workflow` | done |
| 批次 2 | `ergonomics/posture`、`reach`、`vision`、`comfort` | done |
| 批次 3 | `ip-cnsl/ip`、`cnsl`、`check` | done |
| 批次 4 | `door-trim/door`、`pillar`、`roof`、`check` | done |
| 批次 5 | `front-rear/front`、`rear`、`check` | done |
| 批次 6 | `sections/process`、`method`、`library` | done |
| 批次 7 | `process/overview`、`milestones`、`deliverables` | done |
| 批次 8 | `parameters/dimensions`、`mass`、`performance` | done |
| 批次 9 | `tools/software`、`learning`、`career`、`basics/responsibilities`、`basics/standards` | done |
| 收口 | `basics/overview` 剩余 5 处占位 | done（未改动 `parameters/benchmark.md`，按要求冻结） |

**最终验收（`python site-check.py --http`）**：

| 指标 | 结果 |
|---|---|
| nav 页面数 | 36 |
| 已填充页（无骨架占位且正文 > 800 字） | **35**（仅 `about.md` 663 字不计入） |
| `*待补充*` 残留 | **0** |
| 「待人工补充」知识库缺口标注 | **28 处 / 23 页** |
| Mermaid 图块（全部为 flowchart LR） | **36** |
| 失效图片引用 | **0** |
| 失效站内链接 | **0** |
| HTTP 200 | **36/36** |
| 构建 ERROR | **0** |

> 各页仍保留**「待人工补充」admonition**（属要求的占位机制，非未完成项）：
> 用于标注知识库真实缺口（`.doc` 无法解析、扫描版 PDF、纯图片型微信文章、库内无对应条款）。
> 这些框内均写明**已检索关键词**与**建议补充来源**，便于后续按需补齐。

## 三之一、两条硬性约定（2026-09-17 追加）

| # | 约定 | 落地方式 |
|---|---|---|
| 1 | **`docs/parameters/benchmark.md` 冻结，不做任何修改** | 该页为对标数据库（含 `benchmark.json` + 交互脚本），内容填充时**跳过**；`site-check` 会把它计入"已填充"但不做改动 |
| 2 | **脑图统一为「左→右、上→下」简约树形**，禁止中心发散式布局 | 由 `convert-diagrams.py` 把全站 `mermaid mindmap` 批量转换为 `mermaid flowchart LR`（已转换 9 处）；**新页面一律直接用 `flowchart LR` 书写** |

> 转换脚本可重复执行（只处理首行为 `mindmap` 的围栏块，`flowchart` 块不受影响）；
> 用法：`python convert-diagrams.py` 预览，`python convert-diagrams.py --write` 写入。

## 三之二、经验教训（批次 3 追加）

- **必须先读完整文件再下"知识库无此条款"的结论**：批次 3 初稿时只读了 `SJ 46-2009` 前 15 页，
  误判"手套箱无条款"；补读 §6.13～6.17 后发现手套箱有完整要求（周边间隙 2 mm、容积 A4、
  开启开口约 140 mm、上分缝位置），已修正页面。**判定"缺失"前应确认已读到文件末尾**。
- **同一规范的引用网络可以直接当取材地图**：`SJ 46-2009` §2 引用了 `SJ 8/40/47/48/49/50`，
  顺着引用链一次性拉齐 8 份文件即覆盖了 IP&CNSL 全部三页。
- **GM 系列虽为英文，但数值密度极高**：`U02`（按钮）、`S00`（中控娱乐）各 2～3 页就给出了
  完整的尺寸/力值/间隙体系，是中文规范的有效补充。

## 四、已知限制与待办

- [ ] **扫描版 PDF**（AEM-A0-005/200/203/009/011、AEM-A5-001/105/203/501、AEM-A4-301、AEM-A1-504、AEM-A3-001）无法抽取文本，相关页面按第 6 条保留占位。
- [ ] 微信文章多为纯图片型，需视觉识别后才能配文与配图注。
- [ ] PPT 内嵌图目前未按幻灯片归属命名，配文前需按页核对。
- [ ] `.doc`（二进制旧格式）暂不支持解析（python-docx 仅支持 `.docx`）。
- [ ] 脑图依赖 Mermaid CDN（Material 内置 mermaid@11）；如需完全离线需本地化 mermaid 资源。
