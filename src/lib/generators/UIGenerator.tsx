import React from 'react';
import {
  Button,
  TextField,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
} from '@mui/material';
import { Language, Save, Upload, Download } from '@mui/icons-material';
import { UIComponent, UIConfig, UIType, detectUITypeFromPrompt } from '../types/uiTypes';
import { OpenAIService } from '../services/openaiService';

export class UIGenerator {
  private static components: Record<string, React.ComponentType<any>> = {
    Button,
    TextField,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Language,
    Save,
    Upload,
    Download
  };

  static async generateConfig(prompt: string): Promise<UIConfig> {
    try {
      // OpenAI APIを使用してUIコンポーネントを生成
      return await OpenAIService.generateUIComponents(prompt);
    } catch (error) {
      console.error('UI生成エラー:', error);
      
      // エラー時はフォールバック処理
      const uiType = detectUITypeFromPrompt(prompt);
      let components: UIComponent[] = [];

      switch (uiType) {
        case UIType.REPORT:
          components = this.generateReportComponents(prompt);
          break;
        case UIType.LOG_VIEWER:
          components = this.generateLogViewerComponents(prompt);
          break;
        case UIType.DATA_ANALYSIS:
          components = this.generateDataAnalysisComponents(prompt);
          break;
        case UIType.FORM:
          components = this.generateFormComponents(prompt);
          break;
        default:
          components = this.generateDefaultComponents(prompt);
      }

      return {
        type: uiType,
        components
      };
    }
  }

  private static generateReportComponents(prompt: string): UIComponent[] {
    return [
      {
        type: 'Typography',
        props: {
          variant: 'h6',
          text: '調査結果',
          gutterBottom: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: '調査所見',
          multiline: true,
          rows: 4,
          fullWidth: true,
          placeholder: 'こちらに調査内容と所見を記入してください'
        }
      },
      {
        type: 'Typography',
        props: {
          variant: 'h6',
          text: '問題点',
          gutterBottom: true,
          sx: { mt: 3 }
        }
      },
      {
        type: 'TextField',
        props: {
          label: '検出された問題',
          multiline: true,
          rows: 3,
          fullWidth: true,
          placeholder: '発見された問題点をリストアップしてください'
        }
      },
      {
        type: 'Typography',
        props: {
          variant: 'h6',
          text: '対応策',
          gutterBottom: true,
          sx: { mt: 3 }
        }
      },
      {
        type: 'TextField',
        props: {
          label: '推奨される対応',
          multiline: true,
          rows: 3,
          fullWidth: true,
          placeholder: '問題に対する対応策を記入してください'
        }
      }
    ];
  }

  private static generateLogViewerComponents(prompt: string): UIComponent[] {
    return [
      {
        type: 'Typography',
        props: {
          variant: 'body1',
          text: 'システムログの分析を行います。ログファイルをアップロードするか、直接入力してください。',
          gutterBottom: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: 'ログ内容',
          multiline: true,
          rows: 10,
          fullWidth: true,
          placeholder: 'ログデータを入力...'
        }
      },
      {
        type: 'TextField',
        props: {
          label: '検索キーワード',
          fullWidth: true,
          placeholder: 'エラーやイベントのキーワードを入力',
          sx: { mt: 2 }
        }
      }
    ];
  }

  private static generateDataAnalysisComponents(prompt: string): UIComponent[] {
    return [
      {
        type: 'Typography',
        props: {
          variant: 'body1',
          text: 'データ分析パラメータを設定してください。',
          gutterBottom: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: 'データソース',
          fullWidth: true,
          placeholder: 'データファイルのパスまたはURL'
        }
      },
      {
        type: 'Select',
        props: {
          label: '分析タイプ',
          fullWidth: true
        },
        children: [
          {
            type: 'MenuItem',
            props: {
              value: 'trend',
              label: 'トレンド分析'
            }
          },
          {
            type: 'MenuItem',
            props: {
              value: 'anomaly',
              label: '異常検知'
            }
          },
          {
            type: 'MenuItem',
            props: {
              value: 'correlation',
              label: '相関分析'
            }
          }
        ]
      }
    ];
  }

  private static generateFormComponents(prompt: string): UIComponent[] {
    return [
      {
        type: 'TextField',
        props: {
          label: '機器名',
          fullWidth: true,
          required: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: '機器ID',
          fullWidth: true,
          required: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: '設置場所',
          fullWidth: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: '作業内容',
          multiline: true,
          rows: 4,
          fullWidth: true,
          placeholder: '実施した作業の詳細を記入してください'
        }
      },
      {
        type: 'Select',
        props: {
          label: '状態',
          fullWidth: true
        },
        children: [
          {
            type: 'MenuItem',
            props: {
              value: 'operational',
              label: '稼働中'
            }
          },
          {
            type: 'MenuItem',
            props: {
              value: 'maintenance',
              label: 'メンテナンス中'
            }
          },
          {
            type: 'MenuItem',
            props: {
              value: 'error',
              label: 'エラー状態'
            }
          }
        ]
      }
    ];
  }

  private static generateDefaultComponents(prompt: string): UIComponent[] {
    return [
      {
        type: 'Typography',
        props: {
          variant: 'body1',
          text: prompt,
          gutterBottom: true
        }
      },
      {
        type: 'TextField',
        props: {
          label: '入力',
          fullWidth: true
        }
      },
      {
        type: 'Button',
        props: {
          variant: 'contained',
          label: '送信',
          sx: { mt: 2 }
        }
      }
    ];
  }

  static async generateComponent(prompt: string): Promise<UIConfig> {
    return await this.generateConfig(prompt);
  }
} 