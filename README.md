# ai-vido

基于 **Next.js 16** 的 AI 短剧 / 内容自动化网站（MVP）。  
本仓库负责 **脚本与分镜策划**，视频、配音、剪辑等成片环节通过 **外部工具分工** 完成。

仓库地址：[https://github.com/pluto13-shq/ai-vido](https://github.com/pluto13-shq/ai-vido)

---

## 功能概览

| 模块 | 说明 |
|------|------|
| **AI短剧生产** | 输入标题 → 生成正文、剧本、角色、分镜与英文视频提示词 → 按环节复制到 ChatGPT / 可灵 / 剪映等 |

**推荐制作顺序（外链工具）：**

```
脚本创作 → 视频生成 → 去水印去字幕 → 配音 → 字幕 → 剪辑合成
```

---

## 快速启动

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。默认进入 **「AI短剧生产」** 页。

生产构建：

```bash
npm run build
npm run start
```

---

## 项目结构

```
ai-video/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 首页，挂载 AppShell
│   │   └── api/                # 服务端 API
│   │       └── workflow/       # 短剧分步工作流
│   ├── components/             # React 客户端组件
│   └── lib/                    # 业务逻辑与工具库
├── public/                     # 静态资源（如 BGM）
└── package.json
```

---

## 页面与组件

### `src/components/app-shell.tsx`

应用外壳，直接挂载 `NovelWorkflowPanel`（AI短剧生产）。

### `src/components/novel-workflow-panel.tsx`

短剧生产主界面（核心流程）。

1. 用户填写 **作品标题**、语言、画幅（9:16 / 16:9）。
2. 点击「生成脚本与分镜」，前端按步调用 `POST /api/workflow`：
   - `novel` → 正文
   - `script` → 分场剧本
   - `characters` → 角色设定
   - `storyboard` → 分镜 + **英文视频提示词**
3. 展示流水线进度、剧本 / 角色 / 分镜 / 英文提示词等 Tab。
4. 若 API 余额不足，自动回退 **本地故事模板**（见 `story-templates.ts`）。

默认 **不** 站内合成视频、**不** 生成 AI 分镜图（交给可灵 / 即梦等外链）。

### `src/components/short-drama-tools-panel.tsx`

**工具分工表** UI：六环节推荐工具、关联当前生成内容、**复制本环节交付物** / **复制工具分工表**。

数据与文案由 `src/lib/short-drama-workflow.ts` 中的 `buildStageDelivery()` 生成。

## API 路由

| 路径 | 方法 | 作用 |
|------|------|------|
| `/api/workflow` | POST | 短剧工作流。带 `step` 时分步执行；不带则一次性跑完全流程 |

`workflow` 路由 `maxDuration = 300`（秒），适配分镜等较慢步骤。

---

## 核心业务：`novel-pipeline.ts`

短剧改编流水线，导出：

- `runNovelWorkflowStep(payload)` — 单步执行（前端逐步生成用）
- `runNovelWorkflow(input)` — 一次性全流程

### 内部步骤（`WorkflowStageId`）

| 步骤 | 说明 |
|------|------|
| `novel` | 根据标题生成小说正文（可选 LLM，否则 `story-templates` 模板） |
| `script` | 正文 → 分场剧本（`ScriptBeat[]`：幕、旁白、对白、说话人） |
| `characters` | 从正文提取角色名，生成外观 / 性格 / 立绘（可选 AI 图） |
| `storyboard` | 剧本 → 分镜列表，含机位、画面、对白、**englishPrompt** |
| `video` | 可选：ffmpeg 合成 mp4（`composeVideo: true` 时） |

关键参数（`NovelWorkflowStepPayload`）：

- `composeVideo` — 默认前端传 `false`，视频环节标记为「外链：可灵 / 即梦 / …」
- `generateSceneImages` — 默认 `false`，不调用绘图 API
- `preferLocalTemplate` — 余额不足时跳过 LLM，用本地模板

---

## 外链工具分工：`short-drama-workflow.ts`

定义六环节与推荐工具，并为每一步生成可复制的 **交付物文本**：

| 环节 ID | 交付物内容 |
|---------|------------|
| `script` | 短剧设定 + 20 集大纲 + 单集分镜脚本 |
| `video` | 各镜头英文提示词（供可灵 / 即梦 / Sora / Seedance） |
| `watermark` | 后期去水印操作说明 |
| `dubbing` | 按场景整理的对白 / 旁白配音稿 |
| `subtitles` | 字幕用对白与旁白全文 |
| `editing` | 按镜头顺序的剪辑清单 |

`buildEnglishVideoPrompt()` 基于 `visual-prompts.ts` 生成写实风英文场景描述。

---

## 故事与模板：`story-templates.ts`

标题感知的故事线（无需 API 即可运行）：

- 标题含「乞丐」等关键词 → 专属四幕剧情（`beggarBeats`）
- 其他标题 → 通用起承转合模板（`genericBeats`）

导出：

- `generateNovelFromTitleFallback()` — 本地正文
- `getTitleAwareVideoBeats()` — 标题感知分镜节拍（供模板与扩展逻辑使用）
- `buildTitleLogline()` — 一句话梗概

---

## 画面与合成

| 文件 | 作用 |
|------|------|
| `visual-prompts.ts` | 中英文写实摄影 / 剧照类提示词 |
| `scene-visual.ts` | `resolveSceneFrame()`：可选付费 API → 免费 FLUX（`free-image.ts`）→ SVG 文字卡片回退 |
| `frame-detect.ts` | 客户端判断 frame 是否为 SVG 渐变卡片 |
| `frame-utils.ts` | 服务端将 SVG / data URI / URL 转为 PNG Buffer |
| `media-renderer.ts` | 生成 SVG 分镜卡片、角色立绘占位图 |
| `video-compose.ts` | fluent-ffmpeg + ffmpeg-static：分镜图序列 + TTS 旁白 + BGM → mp4 |

---

## Provider 层（可选 API）

统一 OpenAI 兼容网关：`providers/openai-client.ts`

| 模块 | 文件 | 用途 |
|------|------|------|
| LLM | `providers/llm.ts` | 标题 → 小说正文、小说 → 剧本 JSON |
| 绘图 | `providers/image.ts` | 角色立绘 / 分镜（FLUX 等） |
| 免费绘图 | `providers/free-image.ts` | Pollinations FLUX 备用 |
| TTS | `providers/tts.ts` | mp4 合成时的旁白配音 |

`api-errors.ts`：识别余额不足错误，提示改用本地模板或外部脚本工具润色。

**不配置任何 Key 也可使用**：正文、剧本、分镜文案、英文提示词、工具分工表均走本地逻辑。

---

## 类型定义：`types.ts`

集中定义工作流相关类型：`NovelWorkflowResult`、`ScriptBeat`、`StoryboardShot`、`NovelCharacter` 等。

---

## 环境变量

复制 `.env.example` 为 `.env.local`（**勿提交 Git**）。

| 变量 | 说明 |
|------|------|
| `APP_BASE_URL` | 站点地址，OAuth 回调用 |
| `OPENAI_API_KEY` / `LLM_*` | 可选，脚本润色用 OpenAI 兼容 API |
| `IMAGE_*` / `TTS_*` | 可选，站内分镜图与 mp4 配音（`composeVideo: true` 时） |

短剧主流程 **推荐** 在 ChatGPT / 可灵 / 剪映等外链完成，环境变量可全部留空。

---

## 数据流示意

```mermaid
flowchart LR
  A[用户输入标题] --> B[novel-workflow-panel]
  B --> C[/api/workflow]
  C --> D[novel-pipeline]
  D --> E[story-templates / llm]
  D --> F[short-drama-workflow]
  F --> G[工具分工表 + 复制交付物]
  G --> H[ChatGPT / 可灵 / 剪映等]
```

---

## 技术栈

- **框架**：Next.js 16（App Router）、React 19、TypeScript  
- **样式**：Tailwind CSS 4  
- **视频**：ffmpeg-static、fluent-ffmpeg  
- **图像**：@resvg/resvg-js（SVG → PNG）

---

## 常见问题

**Q：生成后没有视频？**  
A：当前默认外链制作。复制「英文提示词」到可灵 / 即梦等生成镜头，再在剪映合成。若需站内 mp4，请求体设 `composeVideo: true` 并安装 ffmpeg。

**Q：分镜显示「文字卡片」？**  
A：绘图 API 失败时的 SVG 回退。可配置绘图 Key，或保持外链视频流程（不依赖分镜图）。

**Q：push 失败？**  
A：检查本机访问 GitHub 的网络或代理后执行 `git push origin main`。

---

## 许可证

私有 MVP 项目，使用前请遵守各 AI 平台与社媒平台的服务条款。
