import React from 'react';
import { Box, Drawer, List, ListItem, ListItemText, ListItemButton, Typography, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

const DRAWER_WIDTH = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `${DRAWER_WIDTH}px`,
  }),
}));

interface GeneratedUI {
  id: string;
  title: string;
  timestamp: Date;
  prompt: string;
}

interface LayoutProps {
  children: React.ReactNode;
  generatedUIs: GeneratedUI[];
  onSelectUI: (ui: GeneratedUI) => void;
  selectedUI?: string;
}

export default function Layout({ children, generatedUIs, onSelectUI, selectedUI }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Typography variant="h6" sx={{ p: 2 }}>フィールドエンジニアツール</Typography>
        <Divider />
        <List>
          {generatedUIs.length > 0 ? (
            generatedUIs.map((ui) => (
              <ListItem key={ui.id} disablePadding>
                <ListItemButton 
                  selected={selectedUI === ui.id}
                  onClick={() => onSelectUI(ui)}
                >
                  <ListItemText 
                    primary={ui.title} 
                    secondary={new Date(ui.timestamp).toLocaleString()}
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="まだUIが生成されていません" />
            </ListItem>
          )}
        </List>
      </Drawer>
      <Main open={true}>
        {children}
      </Main>
    </Box>
  );
} 