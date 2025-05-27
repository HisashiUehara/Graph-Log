import { v4 as uuidv4 } from 'uuid';

// 生成されたUIの基本型
export interface GeneratedUI {
  id: string;
  title: string;
  timestamp: Date;
  prompt: string;
  config: UIConfig;
}

// UI設定の型定義
export interface UIConfig {
  type: string;
  components: UIComponent[];
}

export interface UIComponent {
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
}

// エンジニアツールで利用可能なUI種類
export enum UIType {
  REPORT = 'report',
  LOG_VIEWER = 'logViewer',
  DATA_ANALYSIS = 'dataAnalysis',
  FORM = 'form',
  DASHBOARD = 'dashboard',
}

// プロンプトからUIタイプを判定するヘルパー関数
export function detectUITypeFromPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('レポート') || lowerPrompt.includes('report')) {
    return UIType.REPORT;
  }
  
  if (lowerPrompt.includes('ログ') || lowerPrompt.includes('log')) {
    return UIType.LOG_VIEWER;
  }
  
  if (lowerPrompt.includes('分析') || lowerPrompt.includes('解析') || lowerPrompt.includes('analysis')) {
    return UIType.DATA_ANALYSIS;
  }
  
  if (lowerPrompt.includes('フォーム') || lowerPrompt.includes('入力') || lowerPrompt.includes('form')) {
    return UIType.FORM;
  }
  
  return UIType.DASHBOARD;
}

// プロンプトからタイトルを生成するヘルパー関数
export function generateTitleFromPrompt(prompt: string): string {
  // 簡単な実装: 最初の10単語を取得
  const words = prompt.trim().split(/\s+/);
  const title = words.slice(0, 5).join(' ');
  
  return title.length > 30 ? title.substring(0, 30) + '...' : title;
}

// 新しいGeneratedUIを作成するヘルパー関数
export function createGeneratedUI(prompt: string, config: UIConfig): GeneratedUI {
  return {
    id: uuidv4(),
    title: generateTitleFromPrompt(prompt),
    timestamp: new Date(),
    prompt,
    config,
  };
} 