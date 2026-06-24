"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StorageIcon from "@mui/icons-material/Storage";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Check for existing session/uploaded file on mount
  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      try {
        setLoading(true);
        // Attempt to fetch metadata; if it fails, no file is loaded.
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
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
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
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── App Bar ────────────────────────────────────────────────────── */}
      <AppBar position="sticky" id="app-bar">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
              id="menu-toggle"
            >
              <MenuIcon />
            </IconButton>
          )}
          <ShowChartIcon sx={{ mr: 1.5, color: "primary.main" }} />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Market Data Explorer
          </Typography>
          {fileUploaded && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                icon={<StorageIcon sx={{ fontSize: 16 }} />}
                label={`${rowCount.toLocaleString()} rows`}
                size="small"
                color="primary"
                variant="outlined"
                id="row-count-badge"
              />
              <Chip
                label={fileName}
                size="small"
                variant="outlined"
                sx={{ color: "text.secondary", borderColor: "divider" }}
                id="filename-badge"
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box className="sidebar" id="sidebar">
            {sidebarContent}
          </Box>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            slotProps={{
              paper: {
                sx: {
                  width: 340,
                  background: "var(--bg-primary)",
                  borderRight: "1px solid var(--border-subtle)",
                },
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        )}

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          id="main-content"
        >
          {!fileUploaded ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                opacity: 0.7,
              }}
            >
              <ShowChartIcon sx={{ fontSize: 80, color: "primary.dark" }} />
              <Typography variant="h5" color="text.secondary">
                Upload a Feather file to get started
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports .feather files containing derivative market data
                (CE/PE/FUT)
              </Typography>
              {isMobile && (
                <Typography variant="body2" color="primary.main">
                  Tap the menu icon to open the upload panel →
                </Typography>
              )}
            </Box>
          ) : (
            <DataTable
              data={tableData}
              loading={loading}
              onPageChange={handlePageChange}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
