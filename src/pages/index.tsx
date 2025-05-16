import { useState } from 'react';
import { 
  Container, 
  Box, 
  Tabs, 
  Tab, 
  Typography,
  AppBar,
  Toolbar
} from '@mui/material';
import LogAnalysis from '../components/LogAnalysis';
import ReportGenerator from '../components/ReportGenerator';
import MediaProcessor from '../components/MediaProcessor';
import CommandReference from '../components/CommandReference';
import KnowledgeBase from '../components/KnowledgeBase';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Graph-Log: フィールドエンジニアツール
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl">
        <Box sx={{ width: '100%', mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleChange}>
              <Tab label="ログ解析" />
              <Tab label="レポート生成" />
              <Tab label="メディア処理" />
              <Tab label="コマンドリファレンス" />
              <Tab label="ナレッジベース" />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <LogAnalysis />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ReportGenerator />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <MediaProcessor />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <CommandReference />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <KnowledgeBase />
          </TabPanel>
        </Box>
      </Container>
    </>
  );
} 