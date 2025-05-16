import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

interface Command {
  command: string;
  description: string;
  example: string;
  category: string;
}

const CommandReference: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'linux', 'ros', 'docker', 'git'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        }),
      });
      
      const data = await response.json();
      setCommands(data.commands);
    } catch (error) {
      console.error('Error searching commands:', error);
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
            label="コマンドを検索（例：「ファイルの圧縮方法」「ROSのトピック一覧表示」）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category.toUpperCase()}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '検索'}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3}>
            <List>
              {commands.map((command, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6" component="span">
                            {command.command}
                          </Typography>
                          <Chip
                            label={command.category}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                            {command.description}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            例: {command.example}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < commands.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {commands.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="コマンドが見つかりません"
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

export default CommandReference; 