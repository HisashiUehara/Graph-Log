import React, { useState } from 'react';
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
  InputLabel
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

const ReportGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');

  const handleTemplateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const templateId = event.target.value as string;
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setReportContent(template.template);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // ここでAIによるレポート生成を実行
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          content: reportContent,
        }),
      });
      
      const data = await response.json();
      setGeneratedReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      setGeneratedReport('レポートの生成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>レポートテンプレート</InputLabel>
            <Select
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
            multiline
            rows={10}
            variant="outlined"
            label="レポート内容"
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={loading || !selectedTemplate}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'レポート生成'}
          </Button>
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