import type { Platform } from "@/lib/types";

export const runtimeConfig = {
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmModel: process.env.LLM_MODEL ?? "",
};

export const llmEnabled = Boolean(runtimeConfig.llmApiKey);

export interface PlatformOAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  scope: string;
}

function readOAuth(prefix: string, authorizeUrl: string, scope: string): PlatformOAuthConfig {
  return {
    clientId: process.env[`${prefix}_CLIENT_ID`] ?? "",
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`] ?? "",
    authorizeUrl,
    scope,
  };
}

export const platformOAuth: Record<Platform, PlatformOAuthConfig> = {
  douyin: readOAuth("DOUYIN", "https://open.douyin.com/platform/oauth/connect/", "video.create,user_info"),
  kuaishou: readOAuth("KUAISHOU", "https://open.kuaishou.com/oauth2/authorize", "video.publish"),
  bilibili: readOAuth("BILIBILI", "https://passport.bilibili.com/oauth2/authorize", "upload"),
  xiaohongshu: readOAuth("XHS", "https://open.xiaohongshu.com/oauth/authorize", "note.publish"),
  wechat_video: readOAuth("WX_VIDEO", "https://open.weixin.qq.com/connect/oauth2/authorize", "snsapi_userinfo"),
  wechat_oa: readOAuth("WX_OA", "https://open.weixin.qq.com/connect/oauth2/authorize", "snsapi_userinfo"),
  tiktok: readOAuth("TIKTOK", "https://www.tiktok.com/v2/auth/authorize/", "video.publish,video.upload"),
  youtube: readOAuth("YOUTUBE", "https://accounts.google.com/o/oauth2/v2/auth", "https://www.googleapis.com/auth/youtube.upload"),
  facebook: readOAuth("FACEBOOK", "https://www.facebook.com/v19.0/dialog/oauth", "pages_manage_posts"),
  instagram: readOAuth("INSTAGRAM", "https://api.instagram.com/oauth/authorize", "instagram_content_publish"),
  threads: readOAuth("THREADS", "https://threads.net/oauth/authorize", "threads_content_publish"),
  x: readOAuth("X", "https://twitter.com/i/oauth2/authorize", "tweet.write,tweet.read,users.read"),
  pinterest: readOAuth("PINTEREST", "https://www.pinterest.com/oauth/", "pins:write,boards:read"),
  linkedin: readOAuth("LINKEDIN", "https://www.linkedin.com/oauth/v2/authorization", "w_member_social"),
};

export function isOAuthConfigured(platform: Platform): boolean {
  const cfg = platformOAuth[platform];
  return Boolean(cfg.clientId && cfg.clientSecret);
}
