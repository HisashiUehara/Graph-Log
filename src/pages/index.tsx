import { useState, useRef, useEffect } from 'react';
import { TextField, Button, Container, Box, Typography, Paper, Tab, Tabs } from '@mui/material';
import { GraphAI, GraphAIResult } from 'graphai';
import knowledgeFlow from '../flows/knowledge.json';
import logAnalysisFlow from '../flows/logAnalysis.json';
import reportFlow from '../flows/report.json';
import { knowledgeAgent } from '../lib/agents/knowledgeAgent';
import { logAnalysisAgent } from '../lib/agents/logAnalysisAgent';
import { reportAgent } from '../lib/agents/reportAgent';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [logData, setLogData] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [reportData, setReportData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    weather: '',
    vehicle: '',
    testType: '',
    observations: [''],
    metrics: {},
    issues: [''],
    notes: ''
  });
  const [result, setResult] = useState<{ 
    answer?: string; 
    summary?: string; 
    report?: string; 
    metadata?: any;
  }>({});
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setResult({});
  };

  const handleKnowledgeSearch = async () => {
    try {
      setLoading(true);
      const graph = new GraphAI(knowledgeFlow, { agents: { knowledgeAgent } });
      
      graph.injectValue('source', {
        query,
        context: context || undefined
      });

      const result = await graph.run() as GraphAIResult;
      setResult({ answer: result.answer || '' });
    } catch (error) {
      console.error('Error:', error);
      setResult({ answer: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogAnalysis = async () => {
    try {
      setLoading(true);
      const graph = new GraphAI(logAnalysisFlow, { agents: { logAnalysisAgent } });
      
      graph.injectValue('source', {
        log: logData,
        query: logQuery
      });

      const result = await graph.run() as GraphAIResult;
      setResult({
        answer: result.answer || '',
        summary: result.summary || ''
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({ answer: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  const handleReportGeneration = async () => {
    try {
      setLoading(true);
      const graph = new GraphAI(reportFlow, { agents: { reportAgent } });
      
      graph.injectValue('source', {
        data: reportData,
        template: ''  // デフォルトテンプレートを使用
      });

      const result = await graph.run() as GraphAIResult;
      setResult({
        report: result.markdown || '',
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({ report: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  const handleReportFieldChange = (field: string, value: any) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // ファイルアップロードの処理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const template = e.target?.result as string;
      setTemplate(template);
      
      try {
        setLoading(true);
        const graph = new GraphAI(reportFlow, { agents: { reportAgent } });
        
        graph.injectValue('source', {
          template,
          conversation: { messages: [] },
          defaultValues: {}
        });

        const result = await graph.run() as GraphAIResult;
        setMessages([{
          role: 'assistant',
          content: `テンプレートを読み込みました。以下の情報が必要です：\n${result.templateAnalysis?.text || ''}`
        }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages([{
          role: 'assistant',
          content: 'テンプレートの解析中にエラーが発生しました。'
        }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // チャットメッセージの送信
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !template) return;

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: chatInput }
    ];
    setMessages(newMessages);
    setChatInput('');

    try {
      setLoading(true);
      const graph = new GraphAI(reportFlow, { agents: { reportAgent } });
      
      graph.injectValue('source', {
        template,
        conversation: { messages: newMessages },
        defaultValues: {}
      });

      const result = await graph.run() as GraphAIResult;
      setMessages([
        ...newMessages,
        { role: 'assistant', content: result.chatAssistant?.text || '' }
      ]);

      if (result.finalReport) {
        setResult({
          report: result.finalReport,
          metadata: result.metadata
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'エラーが発生しました。' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // チャットが更新されたらスクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Graph-Log Assistant
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="ナレッジベース" />
            <Tab label="ログ解析" />
            <Tab label="レポート生成" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="質問"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="追加コンテキスト（任意）"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleKnowledgeSearch}
              disabled={loading || !query}
              sx={{ mt: 2 }}
            >
              {loading ? '検索中...' : '検索'}
            </Button>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="ログデータ"
              value={logData}
              onChange={(e) => setLogData(e.target.value)}
              margin="normal"
              multiline
              rows={8}
            />
            
            <TextField
              fullWidth
              label="解析クエリ（例：「エラーの原因を特定して」）"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              margin="normal"
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogAnalysis}
              disabled={loading || !logData}
              sx={{ mt: 2 }}
            >
              {loading ? '解析中...' : 'ログを解析'}
            </Button>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="template-upload"
              />
              <label htmlFor="template-upload">
                <Button
                  variant="contained"
                  component="span"
                  fullWidth
                  disabled={loading}
                >
                  テンプレートをアップロード
                </Button>
              </label>
              {template && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  テンプレートが読み込まれています
                </Typography>
              )}
            </Box>

            <Box sx={{ 
              height: '400px', 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                flex: 1, 
                overflowY: 'auto',
                mb: 2,
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1
              }}>
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      textAlign: msg.role === 'user' ? 'right' : 'left'
                    }}
                  >
                    <Paper
                      sx={{
                        display: 'inline-block',
                        p: 1,
                        px: 2,
                        maxWidth: '80%',
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography>{msg.content}</Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="メッセージを入力..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={loading || !template}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={loading || !template || !chatInput.trim()}
                >
                  送信
                </Button>
              </Box>
            </Box>
          </Paper>

          {result.report && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                生成されたレポート
              </Typography>
              <Box component="pre" sx={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1
              }}>
                {result.report}
              </Box>
            </Paper>
          )}
        </TabPanel>

        {(result.answer || result.report) && (
          <Paper sx={{ p: 2 }}>
            {result.answer && (
              <>
                <Typography variant="h6" gutterBottom>
                  分析結果
                </Typography>
                <Typography paragraph>
                  {result.answer}
                </Typography>
              </>
            )}
            {result.summary && (
              <>
                <Typography variant="h6" gutterBottom>
                  要約
                </Typography>
                <Typography>
                  {result.summary}
                </Typography>
              </>
            )}
            {result.report && (
              <>
                <Typography variant="h6" gutterBottom>
                  生成されたレポート
                </Typography>
                <Box component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1
                }}>
                  {result.report}
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
} 