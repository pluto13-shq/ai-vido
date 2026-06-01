import { connectAccount } from "@/lib/accounts";
import { ALL_PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && ALL_PLATFORMS.includes(value as Platform);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const closeScript = (message: string, ok: boolean) =>
    new Response(
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /></head>
<body style="font-family:system-ui;padding:24px">
<p>${message}</p>
<script>
  if (window.opener) { window.opener.postMessage({ type: "oauth", platform: ${JSON.stringify(
    platform
  )}, ok: ${ok ? "true" : "false"} }, "*"); }
  setTimeout(function(){ window.close(); }, 1200);
</script>
</body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );

  if (error) {
    return closeScript(`授权被取消或失败：${error}`, false);
  }

  if (!isPlatform(platform) || !code) {
    return closeScript("授权回调参数无效。", false);
  }

  // 真实场景：此处应使用 code 向平台换取 access_token 并保存。
  connectAccount(platform, `授权账号·${platform}`);
  return closeScript("授权成功，正在返回应用…", true);
}
