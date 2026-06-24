"use client";

import { useState, useCallback, useEffect } from "react";
import { Menu, LineChart, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import FileUpload from "@/components/FileUpload";
import FilterPanel from "@/components/FilterPanel";
import ContractSummary from "@/components/ContractSummary";
import DataTable from "@/components/DataTable";
import type {
  Metadata,
  FilterState,
  PaginatedResponse,
} from "@/types";
import { getMetadata, filterData, getPreview } from "@/lib/api";

export default function HomePage() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [tableData, setTableData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    instrument: "",
    expiry: "",
    strike: "",
    name: "",
  });

  // Check for existing session/uploaded file on mount
  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      try {
        setLoading(true);
        const meta = await getMetadata();
        if (isMounted && meta && meta.total_rows > 0) {
          setFileName(meta.filename || "Previous Upload");
          setRowCount(meta.total_rows);
          setFileUploaded(true);
          setMetadata(meta);

          const preview = await getPreview({ page: 1, page_size: 50 });
          if (isMounted) setTableData(preview);
        }
      } catch (err) {
        // Normal state when starting fresh without a file
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Called after successful file upload
  const handleUploadSuccess = useCallback(
    async (rows: number, filename: string) => {
      setRowCount(rows);
      setFileName(filename);
      setFileUploaded(true);
      setActiveFilters({ instrument: "", expiry: "", strike: "", name: "" });

      try {
        setLoading(true);
        const [meta, preview] = await Promise.all([
          getMetadata(),
          getPreview({ page: 1, page_size: 50 }),
        ]);
        setMetadata(meta);
        setTableData(preview);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Called when filters are applied
  const handleApplyFilters = useCallback(
    async (filters: FilterState) => {
      setActiveFilters(filters);
      try {
        setLoading(true);
        const hasAnyFilter =
          filters.instrument || filters.expiry || filters.strike || filters.name;

        if (hasAnyFilter) {
          const result = await filterData({
            instrument: filters.instrument || undefined,
            expiry: filters.expiry || undefined,
            strike: filters.strike ? parseFloat(filters.strike) : undefined,
            name: filters.name || undefined,
            page: 1,
            page_size: 50,
          });
          setTableData(result);
        } else {
          const result = await getPreview({ page: 1, page_size: 50 });
          setTableData(result);
        }
      } catch (err) {
        console.error("Error applying filters:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Called when pagination/sort changes in the table
  const handlePageChange = useCallback(
    async (page: number, pageSize: number, sortBy?: string, sortOrder?: string) => {
      try {
        setLoading(true);
        const hasAnyFilter =
          activeFilters.instrument ||
          activeFilters.expiry ||
          activeFilters.strike ||
          activeFilters.name;

        if (hasAnyFilter) {
          const result = await filterData({
            instrument: activeFilters.instrument || undefined,
            expiry: activeFilters.expiry || undefined,
            strike: activeFilters.strike
              ? parseFloat(activeFilters.strike)
              : undefined,
            name: activeFilters.name || undefined,
            page,
            page_size: pageSize,
            sort_by: sortBy,
            sort_order: sortOrder as "asc" | "desc",
          });
          setTableData(result);
        } else {
          const result = await getPreview({
            page,
            page_size: pageSize,
            sort_by: sortBy,
            sort_order: sortOrder,
          });
          setTableData(result);
        }
      } catch (err) {
        console.error("Error changing page:", err);
      } finally {
        setLoading(false);
      }
    },
    [activeFilters]
  );

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col gap-4 p-4">
      <FileUpload onUploadSuccess={handleUploadSuccess} />
      {metadata && (
        <>
          <FilterPanel
            metadata={metadata}
            onApplyFilters={handleApplyFilters}
          />
          <ContractSummary metadata={metadata} />
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* App Bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-1 items-center gap-4">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[340px] p-0">
                <ScrollArea className="h-full">
                  {sidebarContent}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
              Market Data Explorer
            </h1>
          </div>

          {fileUploaded && (
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <Badge variant="outline" className="gap-1 border-primary/20 text-primary">
                <Database className="h-3 w-3" />
                {rowCount.toLocaleString()} rows
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {fileName}
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[340px] shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-md lg:block">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            {sidebarContent}
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden p-4">
          {!fileUploaded ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 opacity-70 animate-in fade-in zoom-in duration-500">
              <LineChart className="h-20 w-20 text-primary/50" />
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  Upload a Feather file to get started
                </h2>
                <p className="text-sm text-muted-foreground/80">
                  Supports .feather files containing derivative market data
                  (CE/PE/FUT)
                </p>
                <p className="text-sm text-primary lg:hidden mt-4">
                  Tap the menu icon to open the upload panel →
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              data={tableData}
              loading={loading}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
