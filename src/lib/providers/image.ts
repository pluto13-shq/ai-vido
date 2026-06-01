/**
 * 图片模型适配层。
 *
 * 你选择了“其他”图片服务商：把接口文档给我后，在 generateImage 里实现真实请求，
 * 返回 PNG/JPEG 的 Buffer。未配置时返回 null，合成流程会回退到渲染的分镜画面。
 */
export function isImageConfigured(): boolean {
  return Boolean(process.env.IMAGE_PROVIDER && process.env.IMAGE_API_KEY);
}

export async function generateImage(prompt: string): Promise<Buffer | null> {
  if (!isImageConfigured()) {
    return null;
  }

  // 占位：接入你的真实图片模型。例如 OpenAI 兼容 /v1/images。
  void prompt;
  throw new Error(
    `IMAGE_PROVIDER=${process.env.IMAGE_PROVIDER} 已配置，但尚未在 src/lib/providers/image.ts 实现真实调用。请提供接口文档。`
  );
}
