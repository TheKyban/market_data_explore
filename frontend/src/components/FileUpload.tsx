"use client";

import { useState, useCallback, useRef } from "react";
import { CloudUpload, CheckCircle2, FileText, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="font-semibold text-sm text-foreground mb-1">Upload Data</h3>

      <div
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            : uploadedFile
            ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500"
            : "border-border/60 bg-card/30 hover:border-blue-500/50 hover:bg-blue-500/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".feather"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-500">
              File uploaded successfully
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <Badge variant="outline" className="gap-1 border-emerald-500/30 text-muted-foreground font-normal">
                <FileText className="h-3 w-3" />
                {uploadedFile.name}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                {uploadedFile.rows.toLocaleString()} rows
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Click or drag to upload a different file
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <CloudUpload
              className={`h-10 w-10 transition-colors duration-300 ${
                isDragOver ? "text-blue-500" : "text-muted-foreground/60"
              }`}
            />
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? "Drop your file here" : "Drag & drop a .feather file"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse (max 100 MB)
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-2 space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm relative">
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-destructive/70 hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
          </button>
          <div className="pr-6">{error}</div>
        </div>
      )}
    </div>
  );
}
