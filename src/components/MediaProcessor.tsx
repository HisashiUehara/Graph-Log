import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ReactPlayer from 'react-player';

interface ProcessingOption {
  id: string;
  name: string;
  description: string;
}

const processingOptions: ProcessingOption[] = [
  {
    id: 'object-detection',
    name: '物体検出',
    description: '画像・動画内の物体を検出し、バウンディングボックスで表示します'
  },
  {
    id: 'lane-detection',
    name: '車線検出',
    description: '道路上の車線を検出し、マーキングを表示します'
  },
  {
    id: 'semantic-segmentation',
    name: 'セマンティックセグメンテーション',
    description: '画像内の各ピクセルをカテゴリ分類し、領域分割を行います'
  }
];

const MediaProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef<ReactPlayer>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setProcessedUrl(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleProcessing = async () => {
    if (!selectedFile || !selectedOption) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('option', selectedOption);

      const response = await fetch('/api/process-media', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setProcessedUrl(data.processedUrl);
    } catch (error) {
      console.error('Error processing media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackRateChange = (event: Event, newValue: number | number[]) => {
    setPlaybackRate(newValue as number);
    if (playerRef.current) {
      playerRef.current.getInternalPlayer().playbackRate = newValue as number;
    }
  };

  const isVideo = selectedFile?.type.startsWith('video/');

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Button
            variant="contained"
            component="label"
            sx={{ mr: 2 }}
          >
            メディアファイルを選択
            <input
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              選択されたファイル: {selectedFile.name}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>処理オプション</InputLabel>
            <Select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              label="処理オプション"
            >
              {processingOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleProcessing}
            disabled={loading || !selectedFile || !selectedOption}
          >
            {loading ? <CircularProgress size={24} /> : '処理開始'}
          </Button>
        </Grid>

        {processedUrl && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                処理結果
              </Typography>
              {isVideo ? (
                <>
                  <ReactPlayer
                    ref={playerRef}
                    url={processedUrl}
                    controls
                    width="100%"
                    height="auto"
                    playbackRate={playbackRate}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom>再生速度: {playbackRate}x</Typography>
                    <Slider
                      value={playbackRate}
                      onChange={handlePlaybackRateChange}
                      min={0.25}
                      max={2}
                      step={0.25}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </>
              ) : (
                <Box
                  component="img"
                  src={processedUrl}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '600px',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MediaProcessor; 