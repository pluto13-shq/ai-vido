import { NextResponse } from "next/server";
import {
  connectAccount,
  disconnectAccount,
  listAccounts,
} from "@/lib/accounts";
import { ALL_PLATFORMS } from "@/lib/platforms";
import { isOAuthConfigured, platformOAuth } from "@/lib/config";
import type { Platform } from "@/lib/types";

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && ALL_PLATFORMS.includes(value as Platform);
}

export async function GET() {
  return NextResponse.json({ accounts: listAccounts() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    platform?: unknown;
  };

  if (!isPlatform(body.platform)) {
    return NextResponse.json({ message: "未知平台" }, { status: 400 });
  }

  const platform = body.platform;

  if (isOAuthConfigured(platform)) {
    const cfg = platformOAuth[platform];
    const redirectUri = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/accounts/callback?platform=${platform}`;
    const authorizeUrl =
      `${cfg.authorizeUrl}?client_id=${encodeURIComponent(cfg.clientId)}` +
      `&response_type=code&scope=${encodeURIComponent(cfg.scope)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&state=${platform}`;

    return NextResponse.json({
      mode: "oauth",
      authorizeUrl,
      message: "请在弹出的窗口完成平台登录授权",
    });
  }

  const account = connectAccount(platform);
  return NextResponse.json({
    mode: "demo",
    account,
    message:
      "未配置该平台开发者凭证，已用演示账号连接（仅用于打通流程，非真实发布）",
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");

  if (!isPlatform(platform)) {
    return NextResponse.json({ message: "未知平台" }, { status: 400 });
  }

  const account = disconnectAccount(platform);
  return NextResponse.json({ account });
}
