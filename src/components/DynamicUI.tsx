import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Language, Send, Save, Delete, Upload, Download, Edit } from '@mui/icons-material';
import { UIComponent, UIType } from '../lib/types/uiTypes';

interface DynamicUIProps {
  type: string;
  components: UIComponent[];
  title: string;
}

export default function DynamicUI({ type, components, title }: DynamicUIProps) {
  // デフォルトのレイアウト
  const renderDefaultLayout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Box>
        {components.map((component, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            {renderComponent(component)}
          </Box>
        ))}
      </Box>
    </Paper>
  );

  // レポート用のレイアウト
  const renderReportLayout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="レポートタイトル"
            fullWidth
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="作成日"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="作成者"
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="概要"
            multiline
            rows={4}
            fullWidth
          />
        </Grid>
        {components.map((component, index) => (
          <Grid item xs={12} key={index}>
            {renderComponent(component)}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
            >
              保存
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // ログビューア用のレイアウト
  const renderLogViewerLayout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<Upload />}>
          ログファイルをアップロード
        </Button>
        <TextField 
          label="検索" 
          size="small" 
          sx={{ flexGrow: 1 }}
        />
        <Button variant="contained">
          検索
        </Button>
      </Box>
      <Paper 
        variant="outlined" 
        sx={{ 
          bgcolor: '#f5f5f5', 
          p: 2, 
          height: '400px', 
          overflow: 'auto',
          fontFamily: 'monospace'
        }}
      >
        <pre>
          {`[2023-05-20 14:23:45] INFO: システム起動
[2023-05-20 14:23:46] INFO: データベース接続確立
[2023-05-20 14:24:01] WARN: メモリ使用率が80%を超えています
[2023-05-20 14:25:12] ERROR: デバイス接続エラー（ID: DEV-2234）
[2023-05-20 14:26:33] INFO: 自動復旧プロセス開始
[2023-05-20 14:28:45] INFO: デバイス再接続成功`}
        </pre>
      </Paper>
    </Paper>
  );

  // データ分析用のレイアウト
  const renderDataAnalysisLayout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1">データソース選択</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>データ種類</InputLabel>
                <Select label="データ種類">
                  <MenuItem value="sensor">センサーデータ</MenuItem>
                  <MenuItem value="system">システムログ</MenuItem>
                  <MenuItem value="performance">パフォーマンスデータ</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained">
                読み込み
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1">分析パラメータ</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField label="開始日時" type="datetime-local" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="終了日時" type="datetime-local" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>集計方法</InputLabel>
                  <Select label="集計方法">
                    <MenuItem value="avg">平均値</MenuItem>
                    <MenuItem value="max">最大値</MenuItem>
                    <MenuItem value="min">最小値</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>時間単位</InputLabel>
                  <Select label="時間単位">
                    <MenuItem value="min">分</MenuItem>
                    <MenuItem value="hour">時間</MenuItem>
                    <MenuItem value="day">日</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: '300px', bgcolor: '#f5f5f5', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" align="center">
              グラフがここに表示されます
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // フォーム用のレイアウト
  const renderFormLayout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Grid container spacing={3}>
        {components.map((component, index) => (
          <Grid item xs={12} sm={component.props?.fullWidth ? 12 : 6} key={index}>
            {renderComponent(component)}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button variant="outlined">
              キャンセル
            </Button>
            <Button variant="contained" color="primary">
              送信
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // コンポーネントをレンダリングするヘルパー関数
  const renderComponent = (component: UIComponent): React.ReactNode => {
    switch (component.type) {
      case 'TextField':
        return <TextField {...component.props} />;
      case 'Button':
        return <Button {...component.props}>{component.props.label}</Button>;
      case 'Typography':
        return <Typography {...component.props}>{component.props.text}</Typography>;
      case 'Select':
        return (
          <FormControl fullWidth>
            <InputLabel>{component.props.label}</InputLabel>
            <Select label={component.props.label}>
              {component.children?.map((child, idx) => renderComponent(child))}
            </Select>
          </FormControl>
        );
      case 'MenuItem':
        return <MenuItem value={component.props.value}>{component.props.label}</MenuItem>;
      case 'Checkbox':
        return <FormControlLabel control={<Checkbox />} label={component.props.label} />;
      case 'Divider':
        return <Divider />;
      default:
        return null;
    }
  };

  // UIタイプに応じて適切なレイアウトを選択
  const renderByType = () => {
    switch (type) {
      case UIType.REPORT:
        return renderReportLayout();
      case UIType.LOG_VIEWER:
        return renderLogViewerLayout();
      case UIType.DATA_ANALYSIS:
        return renderDataAnalysisLayout();
      case UIType.FORM:
        return renderFormLayout();
      default:
        return renderDefaultLayout();
    }
  };

  return renderByType();
} 