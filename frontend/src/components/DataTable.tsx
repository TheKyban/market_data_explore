"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type SortChangedEvent,
  type ICellRendererParams,
} from "ag-grid-community";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
    const inst = value.toUpperCase();
    const className =
      inst === "CE"
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        : inst === "PE"
        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
        : "bg-blue-500/10 text-blue-500 border-blue-500/20";

    return (
      <Badge variant="outline" className={`font-bold ${className} px-2 py-0.5 text-[10px]`}>
        {value}
      </Badge>
    );
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
        minWidth: 110,
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
    (newSize: string | null) => {
      if (!newSize) return;
      const size = Number(newSize);
      setPageSize(size);
      onPageChange(1, size, currentSort.field, currentSort.order);
    },
    [currentSort, onPageChange]
  );

  // Loading skeleton
  if (!data && loading) {
    return (
      <div className="flex flex-1 flex-col gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Table header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2 px-4 rounded-lg border border-border/40">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Showing</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            {data.total.toLocaleString()} records
          </Badge>
          <span className="text-sm text-muted-foreground">
            — Page {data.page} of {data.total_pages}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AG Grid */}
      <div
        className={`ag-theme-alpine-dark flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border/40 transition-opacity duration-200 ${
          loading ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
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
      </div>

      {/* Pagination */}
      <div className="py-2 flex justify-center">
        <Pagination>
          <PaginationContent>
            {/* First Page Button */}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (data.page > 1) onPageChange(1, pageSize, currentSort.field, currentSort.order);
                }}
                className={data.page === 1 ? "pointer-events-none opacity-50 px-2" : "px-2"}
                aria-label="Go to first page"
              >
                <span className="text-xs">&laquo;</span>
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (data.page > 1) {
                    onPageChange(data.page - 1, pageSize, currentSort.field, currentSort.order);
                  }
                }}
                className={data.page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {(() => {
              const total = data.total_pages;
              const current = data.page;
              let items: (number | "ellipsis")[] = [];

              if (total <= 7) {
                items = Array.from({ length: total }, (_, i) => i + 1);
              } else if (current <= 3) {
                items = [1, 2, 3, 4, 5, "ellipsis", total];
              } else if (current >= total - 2) {
                items = [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
              } else {
                items = [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
              }

              return items.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={data.page === item}
                      onClick={(e) => {
                        e.preventDefault();
                        if (data.page !== item) {
                          onPageChange(item, pageSize, currentSort.field, currentSort.order);
                        }
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              });
            })()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (data.page < data.total_pages) {
                    onPageChange(data.page + 1, pageSize, currentSort.field, currentSort.order);
                  }
                }}
                className={data.page === data.total_pages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {/* Last Page Button */}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (data.page < data.total_pages) {
                    onPageChange(data.total_pages, pageSize, currentSort.field, currentSort.order);
                  }
                }}
                className={data.page === data.total_pages ? "pointer-events-none opacity-50 px-2" : "px-2"}
                aria-label="Go to last page"
              >
                <span className="text-xs">&raquo;</span>
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
