# ai-vido

Agent 内容工厂（MVP）——基于 Next.js 的 AI 内容自动化网站。

## 功能概览

- AI Agent 批量生成视频/图文内容（脚本、分镜、旁白）
- 一键合成真实 mp4（ffmpeg，支持 9:16 / 16:9）
- 连接账号后分发到 10+ 主流平台
- 目标语言：中文 / 英文

## 快速启动

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写密钥。

## 主要目录

- `src/components/creator-dashboard.tsx` — 控制台
- `src/app/api/jobs/route.ts` — 生成任务
- `src/app/api/compose/route.ts` — mp4 合成
- `src/lib/video-compose.ts` — ffmpeg 合成核心
- `src/lib/agent-orchestrator.ts` — Agent 编排
