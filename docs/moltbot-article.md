# moltbot 决不可能代替你做的事

moltbot 最近很火，时间线上都是它，moltbot 可以替你干活，但是有一件事，是它绝对无法替代你的。

**那就是：每天主动关注你所在领域的最新动态。**

AI 能帮你写代码、做总结、查文档，但它不会在早晨推送一杯咖啡时告诉你："昨晚 Rust 社区爆了个大新闻"或"Reddit 上有人发现了一个颠覆性的 Agent 框架"。它不关心你关心什么，除非你先开口问。

信息获取这件事，本质上是一种**主动行为**——你需要知道去哪里看、看什么、怎么筛选。而大多数人的现状是：收藏了一堆 RSS 源，关注了十几个 subreddit，订阅了各种 newsletter，但真正每天花时间去消化的，寥寥无几。

所以我们做了一件事：**让 AI 替你完成"获取"，你只负责"消化"。**

---

## AI Rust News：你的 AI 和 Rust 信息站

我们上线了一个新闻聚合站点 —— [AI Rust News](https://github.com/ZhangHanDong/ai-rust-news)。

它长这样：首页分为三个区域 —— **AI**、**论文**、**Rust**，每个区域下是由 AI 自动生成的结构化报告。点击进入任意一篇，你看到的不是一堆粗糙的文字堆砌，而是经过组件化渲染的阅读体验：指标卡片、分类标签、趋势箭头、代码块、公式渲染，甚至支持中英文一键切换。

这些报告不是人工编辑的，而是由一套 Claude Code Skills 自动采集、分析、生成的。

---

## 信息从哪来？

### Rust 动态：rust-daily

Rust 生态每天都在发生什么？新版本发布了哪些特性？社区在讨论什么热门话题？

`rust-daily` 这个 skill 会从 Reddit 的 r/rust、This Week in Rust、Rust 官方博客等渠道采集内容，自动归纳整理成结构化报告。比如 Rust 1.93 发布时，它会告诉你：13 项语言特性、18 个稳定化 API，每一项都有简要说明和关联链接。

想了解某个具体版本的变更细节？`rust-learner` skill 可以直接拉取 releases.rs 上的 changelog，精确到每个稳定化的 API 签名。它背后依赖的选择器和页面结构信息，来自 Actionbook 的预计算数据——这意味着不需要每次都重新解析网页 DOM，直接拿到准确的内容定位。

### AI 动态：ai-daily

r/ClaudeAI 上有人发现了 Claude 的新用法？r/ChatGPT 在讨论 GPT 的最新能力？r/AI_Agents 出现了值得关注的框架？

`ai-daily` 从三个核心 AI 社区采集热门帖子，提取关键信息（标题、热度、评论数、核心观点），然后生成一份带有趋势分析的日报。它会自动识别跨社区的共同话题，标记出高热度讨论，甚至给出可操作的建议。

Reddit 这类 JavaScript 渲染的站点，传统的网页抓取工具往往力不从心。这里用到了 agent-browser 配合 Actionbook 提供的元素选择器，确保在页面结构变化时依然能稳定获取内容。

### 论文解读：arxiv-viewer

学术论文是 AI 领域最前沿的信息源，但读论文的门槛不低。`arxiv-viewer` skill 可以从 arXiv 抓取论文，用 AI 生成结构化的论文解读报告：论文元信息、作者列表、核心贡献、方法概述、关键公式（支持 KaTeX 渲染）、实验结果对比表格，全部自动生成。

一篇晦涩的数学论文，变成了一份 5 分钟就能读完的可视化摘要。

---

## 报告怎么变成网页？

这些 skill 生成的输出，都是统一格式的 JSON 树：

```json
{
  "type": "Report",
  "props": { "title": { "en": "Rust 1.93.0", "zh": "Rust 1.93.0 发布说明" } },
  "children": [
    {
      "type": "MetricsGrid",
      "props": {
        "metrics": [
          { "label": { "en": "Language Features", "zh": "语言特性" }, "value": 13, "trend": "up" }
        ]
      }
    }
  ]
}
```

这套 JSON 格式对应着 **json-ui** 的组件体系——30 多种组件类型，从 `Section`、`MetricsGrid`、`Table` 到 `Formula`、`CodeBlock`、`KeyPoint`，覆盖了技术报告的所有常见场景。

站点本身是一个 Next.js 应用，接收到 JSON 后通过递归渲染器将每个节点映射到对应的 React 组件。新增一篇报告，只需要把 JSON 文件放进 `public/reports/` 目录，push 到 GitHub，Vercel 自动构建部署。

整个流程是这样的：

```
Claude Code Skill（采集 + 分析）
    ↓
JSON 报告（{ type, props, children } 树）
    ↓
json-ui 组件渲染（Next.js + React）
    ↓
Vercel 自动部署
    ↓
你打开网页，喝着咖啡看报告
```

而 i18n 是内建的。每个文本字段都支持 `{ "en": "...", "zh": "..." }` 格式，页面右上角一个按钮就能切换中英文，不需要刷新页面。

---

## 回到开头的问题

moltbot 能替你写代码，能替你做翻译，能替你画图。但它不会替你**保持对世界的好奇心**。

不过，如果你愿意花 30 秒敲一个 `/rust-daily` 或 `/ai-daily`，AI 可以在接下来的几分钟里，把整个社区昨天发生的事情，整整齐齐地摆在你面前。

**你负责好奇，AI 负责跑腿。**

这大概是人和工具之间，最好的分工方式。

---

*AI Rust News 站点开源在 [GitHub](https://github.com/ZhangHanDong/ai-rust-news)，报告由 Claude Code Skills 自动生成，内容采集依托 [Actionbook](https://github.com/actionbook/actionbook) 的网页操作数据服务。*
