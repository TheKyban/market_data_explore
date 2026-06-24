/**
 * MUI Dark Theme — Premium Trading Terminal Aesthetic
 */

"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    secondary: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
    },
    background: {
      default: "#0a0e1a",
      paper: "#111827",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
    divider: "rgba(148, 163, 184, 0.12)",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    subtitle1: {
      fontWeight: 500,
      color: "#94a3b8",
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.8rem",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    body2: {
      color: "#94a3b8",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(17, 24, 39, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.08)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: "rgba(59, 130, 246, 0.2)",
            boxShadow: "0 4px 30px rgba(59, 130, 246, 0.08)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
        },
        contained: {
          boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
          },
        },
        outlined: {
          borderColor: "rgba(148, 163, 184, 0.2)",
          "&:hover": {
            borderColor: "rgba(59, 130, 246, 0.5)",
            background: "rgba(59, 130, 246, 0.05)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(148, 163, 184, 0.15)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(59, 130, 246, 0.4)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(10, 14, 26, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
          boxShadow: "none",
        },
      },
    },
  },
});

export default theme;
