// カスタムエラークラスの定義
export class GraphLogError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GraphLogError';
  }
}

// エラーコードの定義
export const ErrorCodes = {
  TEMPLATE_PARSE_ERROR: 'TEMPLATE_PARSE_ERROR',
  LOG_ANALYSIS_ERROR: 'LOG_ANALYSIS_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

// エラーメッセージの定義
export const ErrorMessages = {
  [ErrorCodes.TEMPLATE_PARSE_ERROR]: 'テンプレートの解析中にエラーが発生しました',
  [ErrorCodes.LOG_ANALYSIS_ERROR]: 'ログの解析中にエラーが発生しました',
  [ErrorCodes.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ErrorCodes.INVALID_INPUT]: '入力データが不正です',
} as const;

// エラーハンドリング関数
export function handleError(error: unknown): string {
  if (error instanceof GraphLogError) {
    return `${ErrorMessages[error.code]}\n${error.message}`;
  }
  if (error instanceof Error) {
    return `予期せぬエラーが発生しました: ${error.message}`;
  }
  return 'エラーが発生しました。もう一度お試しください。';
} 