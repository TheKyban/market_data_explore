"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Skeleton,
  Chip,
  InputBase,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type SortChangedEvent,
  type ICellRendererParams,
} from "ag-grid-community";
import type { PaginatedResponse, MarketDataRow } from "@/types";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface DataTableProps {
  data: PaginatedResponse | null;
  loading: boolean;
  onPageChange: (
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: string
  ) => void;
}

export default function DataTable({
  data,
  loading,
  onPageChange,
}: DataTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [pageSize, setPageSize] = useState(50);
  const [currentSort, setCurrentSort] = useState<{
    field?: string;
    order?: string;
  }>({});

  // Instrument type cell renderer
  const InstrumentCellRenderer = useCallback((params: ICellRendererParams) => {
    const value = params.value as string;
    if (!value) return null;
    const cls = value.toLowerCase();
    return <span className={`instrument-badge ${cls}`}>{value}</span>;
  }, []);

  // Format date for display
  const formatDate = (val: string) => {
    if (!val) return "";
    try {
      const d = new Date(val);
      return d.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "short",
        hour12: false,
      });
    } catch {
      return val;
    }
  };

  const formatExpiry = (val: string) => {
    if (!val) return "";
    try {
      const d = new Date(val + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return val;
    }
  };

  // Column definitions
  const columnDefs = useMemo<ColDef<MarketDataRow>[]>(
    () => [
      {
        headerName: "Timestamp",
        field: "date",
        minWidth: 160,
        sortable: true,
        filter: true,
        valueFormatter: (p) => formatDate(p.value),
      },
      {
        headerName: "Symbol",
        field: "name",
        minWidth: 120,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Instrument",
        field: "instrument_type",
        minWidth: 100,
        sortable: true,
        filter: true,
        cellRenderer: InstrumentCellRenderer,
      },
      {
        headerName: "Expiry",
        field: "expiry",
        minWidth: 120,
        sortable: true,
        filter: true,
        valueFormatter: (p) => formatExpiry(p.value),
      },
      {
        headerName: "Strike",
        field: "strike",
        minWidth: 90,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) =>
          p.value === 0 ? "—" : p.value?.toLocaleString(),
      },
      {
        headerName: "Open",
        field: "open",
        minWidth: 90,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toFixed(2),
      },
      {
        headerName: "High",
        field: "high",
        minWidth: 90,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toFixed(2),
      },
      {
        headerName: "Low",
        field: "low",
        minWidth: 90,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toFixed(2),
      },
      {
        headerName: "Close",
        field: "close",
        minWidth: 90,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toFixed(2),
      },
      {
        headerName: "Volume",
        field: "volume",
        minWidth: 100,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toLocaleString(),
      },
      {
        headerName: "OI",
        field: "oi",
        minWidth: 100,
        sortable: true,
        filter: true,
        type: "numericColumn",
        valueFormatter: (p) => p.value?.toLocaleString(),
      },
    ],
    [InstrumentCellRenderer]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      suppressMovable: false,
    }),
    []
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent) => {
      const sortModel = event.api.getColumnState().filter((c) => c.sort);
      if (sortModel.length > 0) {
        const sort = {
          field: sortModel[0].colId,
          order: sortModel[0].sort || "asc",
        };
        setCurrentSort(sort);
        onPageChange(1, pageSize, sort.field, sort.order);
      } else {
        setCurrentSort({});
        onPageChange(1, pageSize);
      }
    },
    [pageSize, onPageChange]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      onPageChange(1, newSize, currentSort.field, currentSort.order);
    },
    [currentSort, onPageChange]
  );

  // Loading skeleton
  if (!data && loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={40}
            sx={{ borderRadius: 1 }}
            className="animate-shimmer"
          />
        ))}
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minHeight: 0,
      }}
      className="animate-fade-in-up"
      id="data-table-section"
    >
      {/* Table header bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ textTransform: "none", letterSpacing: 0 }}>
            Showing
          </Typography>
          <Chip
            label={`${data.total.toLocaleString()} records`}
            size="small"
            color="primary"
            variant="outlined"
            id="record-count-chip"
          />
          <Typography variant="subtitle2" sx={{ textTransform: "none", letterSpacing: 0 }}>
            — Page {data.page} of {data.total_pages}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              variant="outlined"
              id="page-size-select"
              sx={{ fontSize: "0.8rem" }}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* AG Grid */}
      <Box
        className="ag-theme-alpine-dark"
        sx={{
          flex: 1,
          minHeight: 400,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 0.2s",
        }}
        id="ag-grid-container"
      >
        <AgGridReact
          ref={gridRef}
          rowData={data.data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onSortChanged={handleSortChanged}
          animateRows={true}
          suppressPaginationPanel={true}
          domLayout="normal"
          headerHeight={44}
          rowHeight={38}
          suppressCellFocus={true}
          enableCellTextSelection={true}
        />
      </Box>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 1,
        }}
      >
        <Pagination
          count={data.total_pages}
          page={data.page}
          onChange={(_e, page) =>
            onPageChange(page, pageSize, currentSort.field, currentSort.order)
          }
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          id="pagination"
          sx={{
            "& .MuiPaginationItem-root": {
              color: "text.secondary",
              borderColor: "rgba(148, 163, 184, 0.15)",
              "&.Mui-selected": {
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "primary.main",
                borderColor: "rgba(59, 130, 246, 0.3)",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
