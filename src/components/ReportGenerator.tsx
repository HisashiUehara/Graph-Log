import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface ReportTemplate {
  id: string;
  name: string;
  template: string;
}

const templates: ReportTemplate[] = [
  {
    id: 'incident',
    name: '事故・インシデントレポート',
    template: '## インシデント概要\n\n## 発生時刻\n\n## 場所\n\n## 詳細\n\n## 対応措置\n\n## 今後の対策'
  },
  {
    id: 'maintenance',
    name: '定期メンテナンスレポート',
    template: '## 点検概要\n\n## 実施日時\n\n## 点検項目\n\n## 結果\n\n## 特記事項\n\n## 次回点検予定'
  },
  {
    id: 'test',
    name: 'テスト走行レポート',
    template: '## テスト概要\n\n## 実施日時\n\n## 天候・路面状況\n\n## テスト項目\n\n## 結果\n\n## 課題・改善点'
  }
];

interface ReportGeneratorProps {
  initialTemplate?: string;
  initialPrompt?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ initialTemplate, initialPrompt }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [customPrompt, setCustomPrompt] = useState(initialPrompt || '');

  // 初期テンプレートがある場合は設定
  useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplate(initialTemplate);
      const template = templates.find(t => t.id === initialTemplate);
      if (template) {
        setReportContent(template.template);
      }
    }
  }, [initialTemplate]);

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setReportContent(template.template);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // AIによるレポート生成を実行
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          content: reportContent,
          prompt: customPrompt // カスタムプロンプトがあれば送信
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }
      
      const data = await response.json();
      setGeneratedReport(data.report);
      setSuccessMessage('レポートが正常に生成されました');
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage(`レポートの生成中にエラーが発生しました: ${error.message}`);
      setGeneratedReport('');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
  };

  const handleSaveReport = () => {
    if (!generatedReport) {
      setErrorMessage('保存するレポートがありません');
      return;
    }
    
    // レポートをテキストファイルとしてダウンロード
    const blob = new Blob([generatedReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccessMessage('レポートが保存されました');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {errorMessage && (
          <Grid item xs={12}>
            <Alert severity="error">{errorMessage}</Alert>
          </Grid>
        )}
        
        {successMessage && (
          <Grid item xs={12}>
            <Alert severity="success">{successMessage}</Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>レポートテンプレート</InputLabel>
            <Select<string>
              value={selectedTemplate}
              onChange={handleTemplateChange}
              label="レポートテンプレート"
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="追加指示（オプション）"
            placeholder="例: 2023年6月15日に発生した異常振動の事故レポートを作成して"
            value={customPrompt}
            onChange={handleCustomPromptChange}
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            label="レポート内容"
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading || !selectedTemplate}
            >
              {loading ? <CircularProgress size={24} /> : 'AIでレポート生成'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleSaveReport}
              disabled={!generatedReport}
            >
              レポートを保存
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
            <Typography variant="h6" gutterBottom>
              生成されたレポート
            </Typography>
            <Box sx={{ mt: 2 }}>
              <ReactMarkdown>{generatedReport}</ReactMarkdown>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportGenerator; 