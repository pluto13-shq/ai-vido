/** 是否为 API 余额/配额类错误 */
export function isBalanceOrQuotaError(message: string): boolean {
  return /insufficient|balance|quota|余额|不足|sorry.*account/i.test(message);
}

export function formatBalanceWarning(language: "zh" | "en" = "zh"): string {
  return language === "zh"
    ? "脚本 API 余额不足，已自动改用本地故事模板继续。可在 ChatGPT / Claude / 文心一言 中继续润色脚本。"
    : "Script API balance low; using local template. Polish in ChatGPT / Claude / etc.";
}

export function normalizeApiErrorMessage(raw: string, language: "zh" | "en" = "zh"): string {
  if (isBalanceOrQuotaError(raw)) {
    return formatBalanceWarning(language);
  }
  return raw;
}
