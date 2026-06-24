"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { uploadFile } from "@/lib/api";

interface FileUploadProps {
  onUploadSuccess: (rows: number, filename: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    rows: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith(".feather")) {
      return "Invalid file type. Only .feather files are accepted.";
    }
    if (file.size > 100 * 1024 * 1024) {
      return "File too large. Maximum size is 100 MB.";
    }
    return null;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const result = await uploadFile(file, (percent) => {
          setProgress(percent);
        });

        setUploadedFile({ name: file.name, rows: result.rows });
        onUploadSuccess(result.rows, file.name);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        // Try to extract detail from axios error
        if (typeof err === "object" && err !== null && "response" in err) {
          const axiosErr = err as { response?: { data?: { detail?: string } } };
          setError(axiosErr.response?.data?.detail || errorMessage);
        } else {
          setError(errorMessage);
        }
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <Box className="animate-fade-in-up" id="file-upload-section">
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Upload Data
      </Typography>

      <Box
        className={`upload-zone ${isDragOver ? "drag-over" : ""} ${
          uploadedFile ? "uploaded" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        id="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".feather"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-input"
        />

        {uploadedFile ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 32, color: "secondary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "secondary.main" }}>
              File uploaded successfully
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
              <Chip
                icon={<InsertDriveFileIcon sx={{ fontSize: 14 }} />}
                label={uploadedFile.name}
                size="small"
                variant="outlined"
                sx={{ borderColor: "rgba(16, 185, 129, 0.3)", color: "text.secondary" }}
              />
              <Chip
                label={`${uploadedFile.rows.toLocaleString()} rows`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Click or drag to upload a different file
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <CloudUploadIcon
              sx={{
                fontSize: 36,
                color: isDragOver ? "primary.main" : "text.secondary",
                transition: "color 0.2s",
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {isDragOver ? "Drop your file here" : "Drag & drop a .feather file"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              or click to browse (max 100 MB)
            </Typography>
          </Box>
        )}
      </Box>

      {/* Upload progress */}
      {uploading && (
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              borderRadius: 4,
              height: 6,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Uploading... {progress}%
          </Typography>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 1.5, borderRadius: 2 }}
          onClose={() => setError(null)}
          id="upload-error"
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
