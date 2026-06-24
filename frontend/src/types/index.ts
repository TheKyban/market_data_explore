/**
 * Shared TypeScript interfaces for Market Data Explorer
 */

/** A single row of market data from the Feather file */
export interface MarketDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi: number;
  symbol: string;
  name: string;
  expiry: string;
  strike: number;
  instrument_type: string;
}

/** Response from the upload endpoint */
export interface UploadResponse {
  rows: number;
  columns: string[];
  filename: string;
}

/** Response from the metadata endpoint */
export interface Metadata {
  instruments: string[];
  names: string[];
  expiries: string[];
  expiries_by_instrument: Record<string, string[]>;
  strikes: number[];
  strikes_by_instrument: Record<string, number[]>;
  strikes_by_name: Record<string, number[]>;
  contract_counts: Record<string, number>;
  total_rows: number;
  filename: string;
}

/** Request body for the filter endpoint */
export interface FilterRequest {
  instrument?: string;
  expiry?: string;
  strike?: number;
  name?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/** Paginated response from filter/preview endpoints */
export interface PaginatedResponse {
  data: MarketDataRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Application state for filters */
export interface FilterState {
  instrument: string;
  expiry: string;
  strike: string;
  name: string;
}
