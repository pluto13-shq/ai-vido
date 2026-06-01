import type { Platform } from "@/lib/types";

export const ALL_PLATFORMS: Platform[] = [
  "douyin",
  "kuaishou",
  "bilibili",
  "xiaohongshu",
  "wechat_video",
  "wechat_oa",
  "tiktok",
  "youtube",
  "facebook",
  "instagram",
  "threads",
  "x",
  "pinterest",
  "linkedin",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: "抖音",
  kuaishou: "快手",
  bilibili: "B站",
  xiaohongshu: "小红书",
  wechat_video: "视频号",
  wechat_oa: "微信公众号",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  threads: "Threads",
  x: "X (Twitter)",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};
