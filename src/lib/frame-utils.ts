import { Resvg } from "@resvg/resvg-js";

/** 将分镜 frame（SVG / 位图 data URI / 远程 URL）转为 PNG Buffer（仅服务端） */
export async function frameToPngBuffer(
  frame: string,
  width: number
): Promise<Buffer> {
  if (frame.startsWith("http://") || frame.startsWith("https://")) {
    const response = await fetch(frame);
    if (!response.ok) throw new Error("分镜图片下载失败");
    return Buffer.from(await response.arrayBuffer());
  }

  if (
    frame.startsWith("data:image/png") ||
    frame.startsWith("data:image/jpeg") ||
    frame.startsWith("data:image/webp")
  ) {
    const b64 = frame.split(",")[1];
    if (!b64) throw new Error("无效的图片 data URI");
    return Buffer.from(b64, "base64");
  }

  let svg = frame;
  if (frame.startsWith("data:image/svg+xml;base64,")) {
    svg = Buffer.from(frame.split(",")[1], "base64").toString("utf8");
  } else if (frame.startsWith("data:image/svg+xml,")) {
    svg = decodeURIComponent(frame.split(",")[1]);
  }

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return Buffer.from(resvg.render().asPng());
}
