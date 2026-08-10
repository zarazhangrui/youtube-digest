# YouTube Digest

[English](README.md) | [简体中文](README.zh-CN.md)

把每个 YouTube 视频变成一份可以深入学习的资料。YouTube Digest 把字幕、双语翻译、AI 概览、内容讲解和时间戳笔记放进同一个 Chrome 侧边栏，让你可以持续学习视频中的知识和语言，同时不丢失原视频上下文。

- 把零碎字幕变成清晰、可搜索的学习资料。
- 查看原文、简体中文翻译，或中英双语对照字幕来学习语言。
- 通过 AI 概览、章节、重点引用和选中文本讲解建立系统理解。
- 点击字幕、概览或笔记中的时间戳，快速跳转到对应位置。
- 保存自动润色的时间戳笔记，方便之后复习。
- 使用自己的 API Key，数据保存在本地 Chrome 中，不包含分析统计或行为追踪。

YouTube Digest 是一个需要自行提供 API Key 的开源项目，通过 GitHub 安装。目前没有上架 Chrome 应用商店，不赠送 API 额度，也没有开发者运营的服务器。

## 让你的编程 Agent 帮你安装

你不需要看懂代码，也不需要会使用命令行。把下面这段话发送给你的编程 Agent：

> 请帮我下载并设置这个项目，一步一步指导我完成安装和配置。请使用简单易懂的语言。https://github.com/zarazhangrui/youtube-digest

你的 Agent 应该帮你：

1. 下载或克隆项目，并保存到一个不会随意删除的文件夹。
2. 打开下方 Supadata 和 DeepSeek 官方页面，指导你创建自己的账号。
3. 指导你在 Chrome 中通过“加载已解压的扩展程序”安装项目。
4. 告诉你应该在扩展的“设置”页面哪个位置填写 API Key。
5. 打开一个带字幕的 YouTube 视频，确认字幕和翻译功能可以使用。

不要把 API Key 发送到 AI 对话、源代码、截图或公开消息中。请你自己在 YouTube Digest 的设置页面直接填写。编程 Agent 可以告诉你填写位置，但不需要看到 Key。

## 手动安装

如果你想自己操作：

1. 打开 [github.com/zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest)。
2. 点击 **Code**，再选择 **Download ZIP**。
3. 解压到一个你准备长期保留的文件夹。
4. 在 Chrome 地址栏打开 `chrome://extensions`。
5. 打开右上角的“开发者模式”。
6. 点击“加载已解压的扩展程序”。
7. 选择包含 `manifest.json` 的项目文件夹。
8. 如果需要，可以在 Chrome 扩展菜单中固定 YouTube Digest。

这是一个本地加载的扩展，不会自动更新。下载新版或让 Agent 修改代码后，请在 `chrome://extensions` 中找到 YouTube Digest 并点击“重新加载”，然后刷新已经打开的 YouTube 页面。

## 设置 API Key

YouTube Digest 需要你在自己的服务账号中准备两个 Key：

1. **Supadata API Key**，用于获取 YouTube 字幕。
2. **AI 服务 API Key**，用于生成概览、讲解内容、翻译和自动润色笔记。

### 获取 Supadata API Key

1. 打开 Supadata 官方[注册页面](https://dash.supadata.ai/auth/sign-up)。
2. 创建账号并完成简短的新手引导。
3. Supadata 会在新手引导过程中自动生成 API Key。
4. 之后可以随时打开 [Supadata 控制台](https://dash.supadata.ai/)查找或管理 Key。
5. 复制 Key，并粘贴到 YouTube Digest 设置中的 **Supadata API key**。

如果页面流程发生变化，请查看 [Supadata 官方文档](https://docs.supadata.ai/)。

### 获取 DeepSeek API Key

1. 打开 DeepSeek 官方 [API Keys 页面](https://platform.deepseek.com/api_keys)。
2. 按照提示登录，或创建 DeepSeek 开放平台账号。
3. 点击 **Create new API key**，填写容易识别的名称，例如 `YouTube Digest`，然后创建 Key。
4. 立即复制 Key。完整 Key 可能只会显示一次。
5. 把 Key 粘贴到 YouTube Digest 设置中的 **AI API key**。
6. 如果 DeepSeek 提示余额不足，请在 DeepSeek 开放平台账号中充值后再试。

当前账号和接口说明请查看 [DeepSeek 官方 API 文档](https://api-docs.deepseek.com/)。

在侧边栏中打开 **Settings**。你也可以在 `chrome://extensions` 的 YouTube Digest 卡片中打开扩展选项。Key 只能粘贴到这些设置输入框中。不要把 Key 发送到 AI 对话、项目文件、截图或公开消息中。

默认 AI 服务是 DeepSeek：

```text
Base URL: https://api.deepseek.com
Model: deepseek-v4-flash
```

YouTube Digest 会让所有 DeepSeek 请求使用非思考模式，以获得更快、更稳定的交互。你也可以填写其他兼容 OpenAI Chat Completions 接口的地址、模型和 API Key。保存自定义地址时，Chrome 会请求访问该地址的权限。

API Key 和设置保存在你设备上的 Chrome 扩展本地存储中。发布包不会包含或使用 `config.js`。

## 使用 YouTube Digest

1. 打开一个有字幕的普通 YouTube 视频页面。
2. 点击 YouTube Digest 扩展图标，打开侧边栏。
3. 阅读带时间戳的字幕，或选择 **Original**、**中文**、**双语**。
4. 打开 **Overview**，查看 AI 生成的章节和重点引用。
5. 选中字幕，获取 AI 内容讲解。
6. 从播放器或重点引用中保存笔记，之后可以在 **Notes** 中查看。

## 当前支持范围

- Chrome 116 或更高版本。
- 标准的 `youtube.com/watch` 视频页面。
- Supadata 能够返回的原生字幕。YouTube Digest 会优先请求英文字幕，也可能显示其他可用的原生语言。
- 原文、简体中文和双语对照字幕。
- AI 概览、选中文本讲解、翻译和自动润色笔记。
- 本地笔记，以及最近字幕、概览和翻译的本地缓存。

Shorts、直播、私密视频、受访问限制的视频，以及没有原生字幕的视频可能无法使用。目前没有测试 Firefox、Safari、移动浏览器或其他 Chromium 浏览器。

YouTube Digest 强制使用 Supadata 的 `mode=native`，不会在没有原生字幕时请求 AI 生成转录，也不会在本地转录音频。

## Supadata 免费额度和请求成本

截至 2026 年 8 月 9 日，[Supadata 价格页面](https://supadata.ai/pricing)显示免费版每月提供 **100 credits**，不需要信用卡，未使用的额度不会结转。价格可能变化，使用前请查看最新页面。

[Supadata 字幕接口文档](https://docs.supadata.ai/get-transcript)说明了不同模式的计费方式：

- 获取一次原生字幕消耗 **1 credit**，与视频时长无关。
- AI 生成字幕每分钟消耗 **2 credits**。YouTube Digest 不会使用这条路径，因为它强制使用 `mode=native`。
- 如果没有可用原生字幕并返回 HTTP `206`，仍会消耗 **1 credit**。

按照当前只获取原生字幕的方式，如果每次请求都成功，免费版每月大约可以查询 100 个视频。重试和没有字幕的查询也会消耗额度，所以实际成功数量可能更少。

AI 服务的额度与 Supadata 分开计算。DeepSeek 或其他自定义 AI 服务可能有自己的免费额度、限速或费用。YouTube Digest 不收款，也不转售 API 服务。建议为两个账号设置消费上限并定期查看用量。下方估算说明了当前 DeepSeek 翻译成本。

## DeepSeek V4 Flash 翻译成本估算

截至 2026 年 8 月 10 日，DeepSeek 官方[价格页面](https://api-docs.deepseek.com/quick_start/pricing/)列出的每 100 万 token 价格是：

- 缓存命中输入：**¥0.02**。
- 缓存未命中输入：**¥1**。
- 输出：**¥2**。

DeepSeek 说明这些价格可能很快上调，因此使用此估算前必须查看当前价格页面。官方 [token 用量指南](https://api-docs.deepseek.com/quick_start/token_usage/)估算每个英文字符约为 0.3 token，每个中文字符约为 0.6 token。[上下文缓存指南](https://api-docs.deepseek.com/guides/kv_cache/)说明了重复前缀使用的自动尽力而为磁盘缓存。

一个实测的 20 分钟英文演讲包含 **2,935 个英文口语词**和 15,433 个字幕字符。按 YouTube Digest 当前的分组方式，它会变成 128 个语义分段，以每次 3 段的方式发出 43 次请求。算上重复 prompt 和 JSON 后，渲染后的输入约为 108,528 个英文字符，按官方每个英文字符 0.3 token 的经验值，即**约 32,600 个输入 token**。按每个中文字符 0.6 token 的经验值，再加上 JSON 和 ID 开销，中文 JSON 输出估计为 3,500 到 4,500 token。

如果所有输入都按缓存未命中计费，输入约 $0.0046，输出约 $0.0010 到 $0.0013，总计约 $0.0056 到 $0.0059。当大量重复的 system prompt 命中 DeepSeek 自动尽力而为缓存时，更现实的低值约为 $0.002 到 $0.003。完整翻译这段演讲的实用估算是 **$0.002 到 $0.006 USD，约 ¥0.02 到 ¥0.04**。

翻译是延迟按需和渐进式的。已缓存的分段会复用，只有滚动到并请求的字幕行才会发起调用。重试、服务商行为和价格变化都可能增加最终成本。

## 用编程 Agent 改造成自己的版本

这是一个个人 Remix 项目，不接受上游 Issue 或 Pull Request。如果功能出错，或者你想增加新功能，请下载或 Fork 自己的副本，再让你的编程 Agent 帮你修复、改造和个性化。

YouTube Digest 使用原生 HTML、CSS 和 JavaScript，没有构建步骤，很适合用编程 Agent 做个人项目。你可以尝试：

- 增加更多翻译语言，并让每个人选择自己的学习语言。
- 为课程、访谈、教程、测评或研究视频增加自定义总结模板。
- 增加生词本，保存单词、原句、解释和视频时间戳。
- 把笔记和生词导出到 Markdown、CSV、Anki 或其他学习工具。
- 增加个人主题筛选，只突出与你目标相关的章节。
- 增加本地模型选项，获得不同的隐私和成本方案。
- 改善键盘操作、字体大小和高对比度等无障碍体验。

请让 Agent 保留用户自带 API Key 的模式，不要把秘密写入源代码，并运行下方检查。分享自己的版本前，也要在真实视频上测试。

## 隐私和数据流向

YouTube Digest 会直接从扩展向服务商发送请求：

1. 把标准化的 YouTube 视频地址发送给 Supadata，用于获取原生字幕。
2. 当你使用 AI 功能时，把字幕和相关视频信息发送给你选择的 AI 服务。
3. 翻译或讲解等功能只发送当前需要的内容，例如选中的文本和上下文，或少量字幕分段。
4. API Key、设置、笔记和最近缓存保存在 Chrome 本地。

YouTube Digest 没有账号系统、广告、分析统计或行为追踪。Supadata 和 AI 服务仍会按照各自的条款和隐私政策处理数据。详情请查看 [PRIVACY.md](PRIVACY.md)。

## 常见问题

### YouTube 视频页面没有显示 Digest 按钮

- 在 `chrome://extensions` 中找到 YouTube Digest，点击“重新加载”，然后刷新 YouTube 页面。
- 确认当前页面是标准 `https://www.youtube.com/watch?...` 页面，而不是 Shorts、嵌入页面或直播页面。
- 当前版本会在 YouTube 响应式操作栏变化时自动重新定位按钮。页面加载完成后可以稍等片刻。
- 如果你使用的是较早下载的版本，可以先横向调整一次 YouTube 窗口宽度让按钮出现，然后下载最新版，这样之后不再需要调整窗口。
- 如果按钮仍然没有出现，让你的编程 Agent 在这个具体视频页面检查 content script。

### 侧边栏无法打开

- 确认你打开的是标准 `https://www.youtube.com/watch?...` 页面。
- 在 `chrome://extensions` 中确认 YouTube Digest 已启用，并点击“重新加载”。
- 重新加载扩展后，刷新 YouTube 页面。
- 如果问题仍然存在，让你的编程 Agent 检查扩展。

### YouTube Digest 提示需要设置

- 打开 **Settings**，保存 Supadata Key 和 AI 服务 Key。
- 确认 AI Base URL 和模型名称正确。
- 如果使用自定义服务，请允许 Chrome 访问对应地址。

### 找不到字幕

- 确认视频是公开的，并且有原生字幕。
- 检查 Supadata Key、剩余额度、限速和账号状态。
- 没有字幕的查询和手动重试也可能消耗额度。

YouTube Digest 不会自动改用 AI 生成字幕。

### AI 请求失败

- `401` 或 `403` 通常表示 Key、账号权限或模型有问题。
- `429` 通常表示达到了服务限速或消费上限。
- 确认自定义服务兼容 OpenAI Chat Completions 接口。
- 长视频可以尝试上下文长度更大的模型。

不要在对话、截图或日志中分享 API Key、私密字幕或个人笔记。

## 给编程 Agent 的检查命令

修改项目后，让你的编程 Agent 运行：

```bash
npm test
npm run check
npm run package
```

Agent 还应该在 Chrome 中重新加载扩展，并测试多个真实 YouTube 视频。自动检查通过，不代表真实服务请求和 YouTube 交互一定正常。

## 开源许可

MIT，详见 [LICENSE](LICENSE)。
