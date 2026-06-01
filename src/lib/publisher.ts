import { getAccount } from "@/lib/accounts";
import { PLATFORM_LABELS } from "@/lib/platforms";
import type { GeneratedAsset, Platform, PublishResult } from "@/lib/types";

async function publishToPlatform(
  asset: GeneratedAsset,
  platform: Platform
): Promise<PublishResult> {
  const account = getAccount(platform);

  if (!account?.connected) {
    return {
      platform,
      assetId: asset.assetId,
      status: "skipped",
      message: `${PLATFORM_LABELS[platform]} 未连接账号，已跳过`,
    };
  }

  if (asset.status === "failed") {
    return {
      platform,
      assetId: asset.assetId,
      status: "failed",
      message: "素材生成失败，无法发布",
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 60));

  if (account.mode === "demo") {
    return {
      platform,
      assetId: asset.assetId,
      status: "published",
      message: `已用演示账号发布（未配置 ${PLATFORM_LABELS[platform]} 开发者凭证，为模拟发布）`,
      publishedUrl: `https://demo.local/${platform}/${asset.assetId}`,
    };
  }

  return {
    platform,
    assetId: asset.assetId,
    status: "published",
    message: `已通过授权账号「${account.accountName}」发布`,
    publishedUrl: `https://publisher.example.com/${platform}/${asset.assetId}`,
  };
}

export async function publishAssets(
  assets: GeneratedAsset[],
  platforms: Platform[]
): Promise<PublishResult[]> {
  const tasks = platforms.flatMap((platform) =>
    assets.map((asset) => publishToPlatform(asset, platform))
  );
  return Promise.all(tasks);
}
