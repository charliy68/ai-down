# AI 落地雷达（自建版）设计文档

日期：2026-09-03
状态：已确认

## 背景与目标

参考 radar.yuedu.biz（「AI 落地与企业应用雷达」）的工作原理与版式，在 Vercel 上自建一个功能相同的站点：每日定时爬取多个官方信息源 → LLM 中文加工 → 规则引擎定级 → 静态渲染展示。数据完全独立于原站，不依赖其任何接口。

关键决策（均已与用户确认）：

- **LLM 加工**：使用 MiniMax M3（用户已有 API Key），生成中文标题、摘要、为什么重要、指标提取。
- **信息源**：只用官方 API 源（8 个），不复刻原站脆弱的 Google News 域名监控。
- **更新机制**：GitHub Actions 定时爬取 + 数据 JSON 提交进仓库 + push 触发 Vercel 自动构建。
- **前端**：布局与信息结构复刻原站，视觉样式重新设计（原站美观度有欠缺，允许适度发挥）。
- **技术栈**：全 TypeScript 单仓（Next.js App Router + Node 爬虫脚本）。

## 总体架构

```
GitHub 仓库（单一 TypeScript 项目）
│
├── crawler/            # 爬虫管线（npm run crawl）
│   ├── sources/        # 信息源适配器（arxiv.ts / github.ts / rss.ts / hn.ts）
│   ├── llm.ts          # MiniMax M3 加工
│   ├── grade.ts        # 规则引擎定级
│   └── main.ts         # 编排
│
├── data/               # 管线输出（git 提交）
│   ├── signals.json    # 全部信号（滚动保留最近 500 条）
│   └── meta.json       # 生成时间、统计、源健康状态
│
├── app/                # Next.js 前端（静态渲染）
├── components/         # UI 组件
└── .github/workflows/  # 每日定时任务
```

每日循环（北京时间 07:30 = UTC 23:30）：

GitHub Actions 触发 → `npm run crawl`（约 2~5 分钟）→ 产出新 `data/*.json` → 有变化则 commit + push → Vercel 自动构建 → 静态页面带最新数据上线。

### 关键设计点

1. **数据即代码**：信号 JSON 提交进仓库，git 历史即数据历史，可回溯、可 revert。
2. **爬虫与前端解耦**：仅通过 `data/*.json` 的 schema 耦合，前后端 import 同一份 TS 类型定义（`shared/types.ts`）。
3. **仓库体积控制**：信号滚动保留最近 500 条（约一个月窗口），防止 JSON 无限膨胀。
4. **复用现有 Vercel 项目关联**（.vercel/project.json，项目名 ai-down）；目录内现有镜像文件在实施收尾时清理。

## 爬虫管线

四个阶段，逐级收窄（对齐原站漏斗模型）：

```
① 采集 Fetch     各源适配器并行抓取 → 标准化 RawItem 列表
② 合并 Dedupe    URL 归一化去重（去 utm 参数、尾斜杠等），与库存对比筛出新增
③ 加工 Enrich    新增条目过 MiniMax M3 → 中文标题/摘要/为什么重要/指标
④ 定级 Grade     规则引擎定等级上限 → 与 LLM 建议取交集 → 合并进 signals.json
```

### 信息源适配器（8 个，全部官方 API）

| 源 | API | 预期量/天 |
|---|---|---|
| arXiv 企业 Agent 主题 | Atom API（search_query） | ~20 |
| arXiv AI 工作流主题 | Atom API | ~20 |
| GitHub AI Agent 项目 | REST search（stars/活跃度） | ~30 |
| GitHub Agent 框架 releases | REST releases | ~7 |
| OpenAI News | 官方 RSS | ~5 |
| Google AI Blog | RSS | ~2 |
| AWS ML Blog | RSS | ~2 |
| Hacker News（AI 企业应用关键词） | Algolia API | ~10 |

统一接口：`fetch(): Promise<RawItem[]>`。失败返回空数组并记入 `meta.json` 的源健康状态，不中断整体管线（复刻原站「任一来源失败不会拖垮整条管线」原则）。

### LLM 加工（MiniMax M3）

- 只对新增条目调用（每天约 15~30 条），存量不重跑，日成本控制在几分钱级。
- 单次输出：`title_zh`、`summary`（150 字内）、`why_it_matters`、`metric` + `metric_label`、`stage` 与 `evidence_grade` 的建议值。
- 失败重试 2 次；某条失败不阻塞，降级为英文原文 + 规则定级，标记 `ai_analyzed: false`。

### 规则引擎定级（模型不能凭空升级）

规则先算上限，LLM 建议只能等于或低于上限：

- **A 级**：一手来源 + 摘要含量化结果（百分比/倍数/绝对数）+ 明确生产环境/线上流量描述
- **B 级**：一手来源 + 有客户/场景 + 有结果描述（可不量化）
- **C 级**：产品发布、试点、论文但无业务结果
- **D 级**：其余（评论、二手转述）

stage（论文/技术 → 产品发布 → 试点验证 → 生产部署 → 规模化）同样规则先行：来源类型 + 关键词（deployment、production、rollout、scale 等加权）。

## 前端（Next.js App Router）

完全静态渲染，构建时读取 `data/*.json`。单页 + 四锚点区块，与原站信息结构一一对应：

```
顶栏：品牌 + 导航（#today #library #method #sources）+ 更新胶囊
01 从技术到规模化      五阶段轨道（可点击筛选）
02 当前最值得看        A/B 级精选 3 张大卡 + 今日判断卡 + 近14天动向
03 全部信号            搜索 + 等级/阶段/来源三组筛选 + 「再加载 12 条」
04 证据怎么分级        A/B/C/D 方法论说明
05 信息源健康          各源状态表（ok / error / 本轮未运行）
页脚：品牌 + RSS 链接（/feed.xml）
```

- **视觉**：保留原站布局骨架与 class 语义命名，样式重新设计——更克制的高级配色、更细腻的排版层级与卡片质感、深浅色模式、入场动效（实现阶段用 frontend-design 技能打磨具体视觉方向）。
- **交互**：纯客户端状态。搜索对标题/摘要/公司/主题即时过滤；三组筛选与搜索叠加；`signals.json` 全量内嵌进页面 bundle，前端分页渲染；更新胶囊读 `meta.json` 的 `generated_at` 与 `stale_after_hours`（30 小时），过期显式标注。
- **组件划分**（单一职责）：`Topbar / Hero / Scoreboard / StageTrack / SignalCard / FilterPanel / MethodSection / SourceHealth / Footer`。
- **空态兜底**：`signals.json` 为空或损坏时显示「等待首次采集」，不白屏。
- **RSS**：构建时从 signals.json 生成 `/feed.xml`。

## 工作流与密钥

`.github/workflows/crawl.yml`：

- 触发：`cron: "30 23 * * *"`（UTC 23:30 = 北京 07:30）+ `workflow_dispatch`（手动调试/首跑）。
- 步骤：checkout → 装 Node → `npm run crawl` → `data/` 有变化则 commit + push，无变化跳过。

密钥（存 GitHub Secrets，不进代码）：

- `MINIMAX_API_KEY`：LLM 加工。
- `PAT_TOKEN`：Actions push 用（避免默认 token 权限问题）。

Vercel 侧无任何密钥（纯静态）。

### 防雪崩

- 单源超时 30s；整体管线超时 15 分钟（Actions 硬限）。
- 管线完全失败：保留昨日 signals.json，网站展示旧数据 + 更新胶囊显示「数据过期」。
- cron 连续失败有 Actions 邮件通知。

## 测试策略（轻量）

- **schema 校验**：爬虫写盘前用 Zod 校验输出，防止坏数据进 git。
- **纯函数单测**（Vitest）：规则引擎定级逻辑（A/B/C/D 判定、URL 归一化去重、stage 关键词判定）。
- **适配器不写单测**：第三方 API 模拟无意义，真跑即测试。
- **前端不写测试**：纯展示，构建成功 + 本地目检。

## 实施顺序

1. 项目脚手架 + 数据 schema + 共享类型
2. 前端（先用本地 `_site_data.json` 真实数据开发）
3. 爬虫管线（8 源 → 去重 → LLM → 定级）
4. Actions 工作流 + 密钥
5. 清理镜像文件，接入现有 Vercel 项目部署

## 明确不做（YAGNI）

- 不做 Google News 域名监控（脆弱易封）
- 不做用户系统、订阅、邮件推送
- 不做外部数据库（Postgres/KV）
- 不做存量条目的 LLM 重跑
- 不做搜索服务端化（纯客户端过滤足够）
