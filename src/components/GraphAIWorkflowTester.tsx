import { useState } from 'react';
import { executeGraphAIWorkflow } from '../lib/utils/api';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography, Paper, CircularProgress } from '@mui/material';

interface WorkflowInputs {
  template?: string;
  conversation?: {
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
  defaultValues?: Record<string, any>;
}

export default function GraphAIWorkflowTester() {
  const [workflowName, setWorkflowName] = useState<string>('report');
  const [inputs, setInputs] = useState<WorkflowInputs>({
    template: '',
    conversation: {
      messages: []
    },
    defaultValues: {}
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationText, setConversationText] = useState<string>('');

  // テンプレート入力の変更を処理
  const handleTemplateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      template: event.target.value
    });
  };

  // 会話入力の変更を処理
  const handleConversationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConversationText(event.target.value);
    
    try {
      // 会話テキストをJSON形式の会話に変換
      const messages = event.target.value.split('\n')
        .filter(line => line.trim())
        .map(line => {
          if (line.startsWith('User: ')) {
            return { role: 'user', content: line.substring(6) };
          } else if (line.startsWith('Assistant: ')) {
            return { role: 'assistant', content: line.substring(11) };
          } else {
            return { role: 'user', content: line };
          }
        });

      setInputs({
        ...inputs,
        conversation: { messages }
      });
    } catch (error) {
      console.error('会話の解析エラー:', error);
    }
  };

  // デフォルト値入力の変更を処理
  const handleDefaultValuesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const defaultValues = JSON.parse(event.target.value || '{}');
      setInputs({
        ...inputs,
        defaultValues
      });
    } catch (error) {
      console.error('デフォルト値の解析エラー:', error);
    }
  };

  // ワークフローを実行
  const executeWorkflow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const workflowResult = await executeGraphAIWorkflow(workflowName, inputs);
      setResult(workflowResult);
    } catch (error) {
      console.error('ワークフロー実行エラー:', error);
      setError(error.message || 'ワークフローの実行中にエラーが発生しました');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        GraphAI ワークフローテスター
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="workflow-select-label">ワークフロー</InputLabel>
          <Select
            labelId="workflow-select-label"
            value={workflowName}
            label="ワークフロー"
            onChange={(e) => setWorkflowName(e.target.value as string)}
          >
            <MenuItem value="report">レポート生成</MenuItem>
            <MenuItem value="knowledge">ナレッジベース</MenuItem>
            <MenuItem value="logAnalysis">ログ分析</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="テンプレート"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          value={inputs.template}
          onChange={handleTemplateChange}
          sx={{ mb: 2 }}
          placeholder="テンプレートを入力してください"
        />
        
        <TextField
          label="会話"
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          value={conversationText}
          onChange={handleConversationChange}
          sx={{ mb: 2 }}
          placeholder="User: こんにちは\nAssistant: いらっしゃいませ\nUser: レポートを作成してください"
        />
        
        <TextField
          label="デフォルト値 (JSON)"
          multiline
          rows={3}
          fullWidth
          variant="outlined"
          onChange={handleDefaultValuesChange}
          sx={{ mb: 2 }}
          placeholder='{"title": "サンプルレポート", "author": "ユーザー名"}'
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={executeWorkflow}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'ワークフローを実行'}
        </Button>
      </Box>
      
      {error && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      {result && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>実行結果</Typography>
          
          {result.finalReport && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">最終レポート:</Typography>
              <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
                {result.finalReport}
              </Paper>
            </Box>
          )}
          
          {result.answer && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">回答:</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {result.answer}
              </Paper>
            </Box>
          )}
          
          {result.metadata && (
            <Box>
              <Typography variant="subtitle1">メタデータ:</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
              </Paper>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
} 