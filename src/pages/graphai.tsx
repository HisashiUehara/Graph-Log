import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import GraphAIWorkflowTester from '../components/GraphAIWorkflowTester';
import Link from 'next/link';

export default function GraphAIPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GraphAI ワークフロー
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          JSONファイルで定義されたワークフローを使用してデータを処理します。
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Link href="/" passHref>
            <Button variant="outlined">ホームに戻る</Button>
          </Link>
        </Box>
        
        <GraphAIWorkflowTester />
      </Box>
    </Container>
  );
} 