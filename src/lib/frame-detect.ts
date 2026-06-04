/** 仅字符串判断，可在客户端组件中使用 */

export function isSvgFrame(frame: string): boolean {
  return (
    frame.startsWith("data:image/svg+xml") ||
    frame.trimStart().startsWith("<svg") ||
    frame.includes("linearGradient")
  );
}

export function isRasterFrame(frame: string): boolean {
  return (
    frame.startsWith("data:image/png") ||
    frame.startsWith("data:image/jpeg") ||
    frame.startsWith("data:image/webp") ||
    frame.startsWith("http://") ||
    frame.startsWith("https://")
  );
}
