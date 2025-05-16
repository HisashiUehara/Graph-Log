import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import { Line } from 'react-chartjs-2';

interface LogData {
  timestamp: string;
  value: number;
}

const LogAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  const [chartData, setChartData] = useState<LogData[]>([]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // ここでAIによるログ解析を実行
      const response = await fetch('/api/analyze-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setResults(data.analysis);
      setChartData(data.chartData);
    } catch (error) {
      console.error('Error analyzing logs:', error);
      setResults('ログの解析中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'ログデータ可視化',
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="自然言語でログを分析（例：「車両の速度が急激に変化した箇所を探して」）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '解析開始'}
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
            <Typography variant="h6" gutterBottom>
              解析結果
            </Typography>
            {results && (
              <Typography variant="body1">
                {results}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
            <Typography variant="h6" gutterBottom>
              データ可視化
            </Typography>
            {chartData.length > 0 && (
              <Line
                data={{
                  labels: chartData.map(d => d.timestamp),
                  datasets: [
                    {
                      label: 'ログデータ',
                      data: chartData.map(d => d.value),
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1,
                    },
                  ],
                }}
                options={chartOptions}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogAnalysis; 