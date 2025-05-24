import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const Input = styled('input')({
  display: 'none',
});

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [signature, setSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setSignature('');
    setVerificationResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file trước!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      setSignature(response.data.signature);
      setError('');
    } catch (err) {
      setError('Lỗi khi tải file lên: ' + err.message);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile || !signature) {
      setError('Vui lòng tải file lên và lấy chữ ký số trước!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('signature', signature);

    try {
      const response = await axios.post('http://localhost:5000/verify', formData);
      setVerificationResult(response.data.is_valid);
      setError('');
    } catch (err) {
      setError('Lỗi khi xác thực chữ ký: ' + err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Ứng dụng truyền file có chữ ký số
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <label htmlFor="file-upload">
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Chọn file
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Đã chọn: {selectedFile.name}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            fullWidth
            sx={{ mb: 2 }}
          >
            Tải lên & Ký số
          </Button>

          {signature && (
            <TextField
              fullWidth
              label="Chữ ký số"
              value={signature}
              multiline
              rows={4}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}

          <Button
            variant="contained"
            color="secondary"
            onClick={handleVerify}
            fullWidth
          >
            Xác thực chữ ký
          </Button>

          {verificationResult !== null && (
            <Alert
              severity={verificationResult ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {verificationResult
                ? 'Chữ ký hợp lệ!'
                : 'Chữ ký không hợp lệ!'}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App; 