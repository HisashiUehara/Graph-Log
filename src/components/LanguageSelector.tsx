import React, { useState } from 'react';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLanguage } from '../lib/contexts/LanguageContext';

const CuteButton = styled(Button)(({ theme }) => ({
  fontFamily: "'Zen Maru Gothic', sans-serif",
  fontSize: '1.2rem',
  borderRadius: '25px',
  padding: '8px 24px',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  fontFamily: "'Zen Maru Gothic', sans-serif",
  fontSize: '1rem',
  minWidth: '120px',
}));

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang: 'ja' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <>
      <CuteButton
        onClick={handleClick}
        variant="contained"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        文 A
      </CuteButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <StyledMenuItem onClick={() => handleLanguageSelect('ja')}>
          日本語
        </StyledMenuItem>
        <StyledMenuItem onClick={() => handleLanguageSelect('en')}>
          English
        </StyledMenuItem>
      </Menu>
    </>
  );
} 