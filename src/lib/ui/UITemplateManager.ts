import { UIIntent } from '../classifiers/IntentClassifier';

export interface UIComponent {
  id: string;
  type: string;
  label?: string;
  options?: string[];
  placeholder?: string;
  [key: string]: any;
}

export interface UITemplate {
  type: string;
  title: string;
  components: UIComponent[];
  layout: {
    direction: string;
    spacing: string;
  };
  styles: {
    theme: string;
    primaryColor: string;
    [key: string]: string;
  };
}

/**
 * 意図に基づいてUIテンプレートを管理するクラス
 */
export class UITemplateManager {
  /**
   * 指定された意図に基づいてUIテンプレートを生成
   * @param intent ユーザーの意図
   * @param customTitle カスタムタイトル
   * @returns UIテンプレート
   */
  static getTemplate(intent: UIIntent, customTitle?: string): UITemplate {
    const baseTitle = this.getTitleForIntent(intent);
    const title = customTitle || baseTitle;
    
    // 共通コンポーネント
    const commonComponents: UIComponent[] = [
      { id: 'submitButton', type: 'button', label: '実行' }
    ];
    
    switch (intent) {
      case 'log-analysis':
        return {
          type: 'log-analysis-ui',
          title: title,
          components: [
            { id: 'fileUpload', type: 'upload', label: 'ログファイルをアップロード' },
            { id: 'analysisOptions', type: 'checkboxGroup', options: ['エラー検出', '警告表示', 'イベント追跡'] },
            { id: 'timeRange', type: 'dateRange', label: '期間選択' },
            { id: 'submitButton', type: 'button', label: '分析開始' }
          ],
          layout: {
            direction: 'vertical',
            spacing: 'medium'
          },
          styles: {
            theme: 'light',
            primaryColor: '#3b82f6'
          }
        };
        
      case 'dashboard':
        return {
          type: 'dashboard-ui',
          title: title,
          components: [
            { id: 'systemSelector', type: 'select', label: 'システム選択', options: ['全て', 'センサー', 'ネットワーク', 'ストレージ'] },
            { id: 'refreshRate', type: 'select', label: '更新頻度', options: ['リアルタイム', '5分ごと', '15分ごと', '1時間ごと'] },
            { id: 'timeRange', type: 'dateRange', label: '表示期間' },
            { id: 'alertLevel', type: 'radioGroup', options: ['全て', '重大', '警告', '情報'] },
            { id: 'submitButton', type: 'button', label: 'ダッシュボードを表示' }
          ],
          layout: {
            direction: 'vertical',
            spacing: 'medium'
          },
          styles: {
            theme: 'dark',
            primaryColor: '#10b981'
          }
        };
        
      case 'report':
        return {
          type: 'report-ui',
          title: title,
          components: [
            { id: 'reportType', type: 'radioGroup', options: ['日次', '週次', '月次', '障害'] },
            { id: 'timeRange', type: 'dateRange', label: 'レポート期間' },
            { id: 'systemSelector', type: 'select', label: '対象システム', options: ['全て', 'センサー', 'ネットワーク', 'ストレージ'] },
            { id: 'includeCharts', type: 'checkbox', label: 'グラフを含める' },
            { id: 'includeRawData', type: 'checkbox', label: '生データを含める' },
            { id: 'format', type: 'radioGroup', options: ['PDF', 'Excel', 'HTML'] },
            { id: 'comments', type: 'textarea', label: '備考', placeholder: '追加情報があれば入力してください' },
            { id: 'submitButton', type: 'button', label: 'レポート生成' }
          ],
          layout: {
            direction: 'vertical',
            spacing: 'medium'
          },
          styles: {
            theme: 'light',
            primaryColor: '#8b5cf6'
          }
        };
        
      default:
        // デフォルトはログ分析UI
        return this.getTemplate('log-analysis', title);
    }
  }
  
  /**
   * 意図に基づいたデフォルトタイトルを取得
   */
  private static getTitleForIntent(intent: UIIntent): string {
    switch (intent) {
      case 'log-analysis':
        return 'ログ分析';
      case 'dashboard':
        return 'システム状態ダッシュボード';
      case 'report':
        return 'レポート生成';
      default:
        return 'フィールドエンジニアツール';
    }
  }
} 