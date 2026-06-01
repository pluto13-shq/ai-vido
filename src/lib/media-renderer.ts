import type { Language } from "@/lib/types";

const PALETTES = [
  { from: "#6d28d9", to: "#db2777" },
  { from: "#0ea5e9", to: "#22c55e" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#1e293b", to: "#6366f1" },
  { from: "#0f766e", to: "#84cc16" },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let current = "";
  const hasLatinWords = /[A-Za-z]/.test(clean) && clean.includes(" ");

  if (hasLatinWords) {
    for (const word of clean.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
      if (lines.length >= maxLines) break;
    }
  } else {
    for (const char of Array.from(clean)) {
      if (current.length >= maxChars) {
        lines.push(current);
        current = "";
      }
      current += char;
      if (lines.length >= maxLines) break;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && clean.length > lines.join("").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, maxChars - 1))}…`;
  }
  return lines;
}

function toDataUri(svg: string): string {
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function textBlock(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  attrs: string
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + index * lineHeight}" ${attrs}>${escapeXml(line)}</text>`
    )
    .join("");
}

export function renderPoster(
  title: string,
  body: string,
  tag: string,
  variant: number
): string {
  const palette = PALETTES[variant % PALETTES.length];
  const titleLines = wrapText(title, 9, 3);
  const bodyLines = wrapText(body.replace(/\n+/g, " · "), 18, 3);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="900" fill="url(#bg)"/>
  <rect x="40" y="40" width="640" height="820" rx="28" fill="rgba(0,0,0,0.18)"/>
  <text x="72" y="120" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="26" font-weight="600">AI 自动生成 · 图文</text>
  ${textBlock(titleLines, 72, 250, 84, 'fill="#ffffff" font-family="sans-serif" font-size="72" font-weight="800"')}
  ${textBlock(bodyLines, 72, 600, 48, 'fill="rgba(255,255,255,0.92)" font-family="sans-serif" font-size="34"')}
  <rect x="72" y="780" width="${Math.min(560, 40 + tag.length * 22)}" height="56" rx="28" fill="rgba(255,255,255,0.22)"/>
  <text x="100" y="817" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="600">${escapeXml(tag)}</text>
</svg>`;

  return toDataUri(svg);
}

export interface FrameOptions {
  width: number;
  height: number;
  sceneIndex: number;
  heading: string;
  action: string;
  dialogue: string;
  variant: number;
  language: Language;
}

export function buildVideoFrameSvg(opts: FrameOptions): string {
  const { width, height, sceneIndex, heading, action, dialogue, variant, language } = opts;
  const palette = PALETTES[(variant + sceneIndex) % PALETTES.length];
  const isPortrait = height >= width;
  const scale = Math.min(width, height) / (isPortrait ? 720 : 720);
  const pad = Math.round(56 * (width / (isPortrait ? 720 : 1280)));

  const headingChars = isPortrait ? 12 : 22;
  const bodyChars = isPortrait ? 16 : 30;
  const headingLines = wrapText(heading, headingChars, 2);
  const actionLines = wrapText(action, bodyChars, 4);
  const dialogueLines = wrapText(dialogue, bodyChars, 3);
  const badge = language === "zh" ? `镜头 ${sceneIndex}` : `Shot ${sceneIndex}`;

  const headingSize = Math.round((isPortrait ? 56 : 64) * (width / (isPortrait ? 720 : 1280)));
  const bodySize = Math.round((isPortrait ? 36 : 40) * (width / (isPortrait ? 720 : 1280)));
  const dialogueSize = Math.round((isPortrait ? 40 : 44) * (width / (isPortrait ? 720 : 1280)));
  const badgeSize = Math.round(30 * (width / (isPortrait ? 720 : 1280)));

  const headingY = Math.round(height * 0.22);
  const actionY = Math.round(height * 0.42);
  const dialogueBoxY = Math.round(height * 0.74);
  const dialogueBoxH = Math.round(height * 0.2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="vg${sceneIndex}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#vg${sceneIndex})"/>
  <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.12)"/>
  <rect x="${pad}" y="${Math.round(height * 0.05)}" width="${80 + badge.length * 22}" height="${Math.round(60 * scale)}" rx="30" fill="rgba(0,0,0,0.45)"/>
  <text x="${pad + 28}" y="${Math.round(height * 0.05) + Math.round(40 * scale)}" fill="#ffffff" font-family="sans-serif" font-size="${badgeSize}" font-weight="700">${escapeXml(badge)}</text>
  ${textBlock(headingLines, pad, headingY, Math.round(headingSize * 1.25), `fill="#ffffff" font-family="sans-serif" font-size="${headingSize}" font-weight="800"`)}
  ${textBlock(actionLines, pad, actionY, Math.round(bodySize * 1.4), `fill="rgba(255,255,255,0.92)" font-family="sans-serif" font-size="${bodySize}"`)}
  <rect x="${Math.round(pad * 0.7)}" y="${dialogueBoxY}" width="${width - Math.round(pad * 1.4)}" height="${dialogueBoxH}" rx="24" fill="rgba(0,0,0,0.4)"/>
  ${textBlock(dialogueLines, pad, dialogueBoxY + Math.round(dialogueSize * 1.4), Math.round(dialogueSize * 1.35), `fill="#ffffff" font-family="sans-serif" font-size="${dialogueSize}" font-weight="600"`)}
</svg>`;
}

export function renderVideoFrame(
  sceneIndex: number,
  heading: string,
  action: string,
  dialogue: string,
  variant: number,
  language: Language,
  width = 360,
  height = 640
): string {
  return toDataUri(
    buildVideoFrameSvg({ width, height, sceneIndex, heading, action, dialogue, variant, language })
  );
}
