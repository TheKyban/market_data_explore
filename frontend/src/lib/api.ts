/**
 * API client for communicating with the Bun API Gateway.
 */

import axios from "axios";
import type {
  UploadResponse,
  Metadata,
  FilterRequest,
  PaginatedResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

/**
 * Upload a .feather file.
 */
export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<UploadResponse>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Get metadata about the currently uploaded dataset.
 */
export async function getMetadata(): Promise<Metadata> {
  const response = await api.get<Metadata>("/api/metadata");
  return response.data;
}

/**
 * Filter the dataset with optional criteria.
 */
export async function filterData(
  filters: FilterRequest
): Promise<PaginatedResponse> {
  const response = await api.post<PaginatedResponse>("/api/filter", filters);
  return response.data;
}

/**
 * Get a paginated preview of the full dataset.
 */
export async function getPreview(params: {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
  search?: string;
}): Promise<PaginatedResponse> {
  const response = await api.get<PaginatedResponse>("/api/preview", {
    params,
  });
  return response.data;
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<{
  gateway: string;
  python_service: unknown;
}> {
  const response = await api.get("/api/health");
  return response.data;
}
