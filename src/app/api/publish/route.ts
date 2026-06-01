import { NextResponse } from "next/server";
import { publishAssets } from "@/lib/publisher";
import { ALL_PLATFORMS } from "@/lib/platforms";
import type { GeneratedAsset, Platform } from "@/lib/types";

function normalizePlatforms(input: unknown): Platform[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input.filter((item): item is Platform =>
        typeof item === "string" && ALL_PLATFORMS.includes(item as Platform)
      )
    )
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    assets?: GeneratedAsset[];
    platforms?: unknown;
  };

  const assets = Array.isArray(body.assets) ? body.assets : [];
  const platforms = normalizePlatforms(body.platforms);

  if (assets.length === 0) {
    return NextResponse.json({ message: "没有可发布的素材" }, { status: 400 });
  }

  if (platforms.length === 0) {
    return NextResponse.json({ message: "请选择至少一个平台" }, { status: 400 });
  }

  const results = await publishAssets(assets, platforms);
  return NextResponse.json({ results });
}
