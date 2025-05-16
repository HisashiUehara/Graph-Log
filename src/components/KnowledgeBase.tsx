import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';

interface SearchResult {
  title: string;
  content: string;
  source: string;
  relevance: number;
  tags: string[];
}

const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="知識ベースを検索（例：「自動運転システムのトラブルシューティング手順」）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '検索'}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3}>
            <List>
              {results.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="span">
                            {result.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 2 }}
                          >
                            関連度: {(result.relevance * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body1"
                            color="text.primary"
                            sx={{ mb: 1 }}
                          >
                            {result.content}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {result.tags.map((tag, tagIndex) => (
                              <Chip
                                key={tagIndex}
                                label={tag}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            出典: {result.source}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {results.length === 0 && query && !loading && (
                <ListItem>
                  <ListItemText
                    primary="検索結果が見つかりません"
                    secondary="別のキーワードで検索してください"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KnowledgeBase; 