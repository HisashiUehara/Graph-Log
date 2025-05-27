export type UIIntent = 'log-analysis' | 'dashboard' | 'report' | 'unknown';

/**
 * ユーザーの入力テキストから意図を分類するクラス
 */
export class IntentClassifier {
  /**
   * ユーザー入力を分析し、UIの意図を特定する
   * @param userInput ユーザーの入力テキスト
   * @returns 分類された意図（log-analysis, dashboard, report, unknown）
   */
  static classify(userInput: string): UIIntent {
    // 小文字に変換して比較を容易にする
    const input = userInput.toLowerCase();
    
    // ログ分析関連の意図
    if (this.matchKeywords(input, [
      'ログ', 'log', '分析', 'analysis', 'エラー', 'error',
      '警告', 'warning', 'ログファイル', 'logfile'
    ])) {
      return 'log-analysis';
    }
    
    // ダッシュボード関連の意図
    if (this.matchKeywords(input, [
      'ダッシュボード', 'dashboard', '状態', 'status', 
      'モニター', 'monitor', '表示', 'display', 
      'リアルタイム', 'realtime', 'システム', 'system'
    ])) {
      return 'dashboard';
    }
    
    // レポート関連の意図
    if (this.matchKeywords(input, [
      'レポート', 'report', '点検', 'inspection', 
      '報告', '記録', 'record', 'テンプレート', 'template',
      'pdf', 'エクセル', 'excel', 'ドキュメント', 'document'
    ])) {
      return 'report';
    }
    
    // デフォルトではログ分析を返す
    return 'log-analysis';
  }
  
  /**
   * 入力テキストが指定されたキーワードのいずれかにマッチするか確認
   */
  private static matchKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }
} 