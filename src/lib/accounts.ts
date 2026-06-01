import { isOAuthConfigured } from "@/lib/config";
import { ALL_PLATFORMS, PLATFORM_LABELS } from "@/lib/platforms";
import type { PlatformAccount, Platform } from "@/lib/types";

type StoredAccount = {
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
  mode: "oauth" | "demo";
};

const globalForAccounts = globalThis as unknown as {
  __accountStore?: Map<Platform, StoredAccount>;
};

const store: Map<Platform, StoredAccount> =
  globalForAccounts.__accountStore ?? new Map<Platform, StoredAccount>();

globalForAccounts.__accountStore = store;

export function listAccounts(): PlatformAccount[] {
  return ALL_PLATFORMS.map((platform) => {
    const record = store.get(platform);
    return {
      platform,
      connected: Boolean(record?.connected),
      accountName: record?.accountName,
      connectedAt: record?.connectedAt,
      mode: record?.mode ?? (isOAuthConfigured(platform) ? "oauth" : "demo"),
    };
  });
}

export function connectAccount(platform: Platform, accountName?: string): PlatformAccount {
  const mode: "oauth" | "demo" = isOAuthConfigured(platform) ? "oauth" : "demo";
  const record: StoredAccount = {
    connected: true,
    accountName:
      accountName ??
      (mode === "demo"
        ? `演示账号·${PLATFORM_LABELS[platform]}`
        : `${PLATFORM_LABELS[platform]}已授权`),
    connectedAt: new Date().toISOString(),
    mode,
  };
  store.set(platform, record);
  return { platform, ...record };
}

export function disconnectAccount(platform: Platform): PlatformAccount {
  store.delete(platform);
  return {
    platform,
    connected: false,
    mode: isOAuthConfigured(platform) ? "oauth" : "demo",
  };
}

export function isConnected(platform: Platform): boolean {
  return Boolean(store.get(platform)?.connected);
}

export function getAccount(platform: Platform): StoredAccount | undefined {
  return store.get(platform);
}
