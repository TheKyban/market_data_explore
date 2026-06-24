"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Collapse,
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TagIcon from "@mui/icons-material/Tag";
import type { Metadata } from "@/types";

interface ContractSummaryProps {
  metadata: Metadata;
}

export default function ContractSummary({ metadata }: ContractSummaryProps) {
  const [expiriesOpen, setExpiriesOpen] = useState(false);
  const [strikesOpen, setStrikesOpen] = useState(false);

  const formatExpiry = (exp: string) => {
    try {
      const d = new Date(exp + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return exp;
    }
  };

  const totalContracts = Object.values(metadata.contract_counts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <Box className="animate-fade-in-up" id="contract-summary" sx={{ animationDelay: "0.2s" }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Contract Summary
      </Typography>

      {/* Row count */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
          <Typography variant="caption" color="text.secondary">
            Total Records
          </Typography>
          <Typography className="stat-value animate-count-up" id="total-rows">
            {metadata.total_rows.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      {/* Contract counts by instrument */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, mb: 1.5 }}>
        {(["CE", "PE", "FUT"] as const).map((inst) => {
          const colorClass =
            inst === "CE" ? "emerald" : inst === "PE" ? "rose" : "";
          const count = metadata.contract_counts[inst] || 0;
          return (
            <Card key={inst} id={`count-${inst.toLowerCase()}`}>
              <CardContent
                sx={{ py: 1.5, px: 1.5, "&:last-child": { pb: 1.5 }, textAlign: "center" }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                  <span
                    className={`instrument-badge ${inst.toLowerCase()}`}
                  >
                    {inst}
                  </span>
                </Box>
                <Typography
                  className={`stat-value ${colorClass}`}
                  sx={{ fontSize: "1.2rem !important" }}
                >
                  {count.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Symbols */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography variant="caption" color="text.secondary">
              Symbols ({metadata.names.length})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {metadata.names.map((name) => (
              <Chip
                key={name}
                label={name}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.7rem",
                  height: 24,
                  borderColor: "rgba(59, 130, 246, 0.2)",
                  color: "text.secondary",
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Expiries (collapsible) */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setExpiriesOpen(!expiriesOpen)}
            id="toggle-expiries"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: "secondary.main" }} />
              <Typography variant="caption" color="text.secondary">
                Expiries ({metadata.expiries.length})
              </Typography>
            </Box>
            <IconButton size="small">
              {expiriesOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
          <Collapse in={expiriesOpen}>
            <Divider sx={{ my: 1 }} />
            {Object.entries(metadata.expiries_by_instrument).map(
              ([inst, expiries]) => (
                <Box key={inst} sx={{ mb: 1.5 }}>
                  <span className={`instrument-badge ${inst.toLowerCase()}`}>
                    {inst}
                  </span>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      flexWrap: "wrap",
                      mt: 0.5,
                    }}
                  >
                    {expiries.map((exp) => (
                      <Chip
                        key={`${inst}-${exp}`}
                        label={formatExpiry(exp)}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          height: 22,
                          backgroundColor: "rgba(148, 163, 184, 0.06)",
                          color: "text.secondary",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* Strikes (collapsible) */}
      <Card>
        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setStrikesOpen(!strikesOpen)}
            id="toggle-strikes"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TagIcon sx={{ fontSize: 16, color: "warning.main" }} />
              <Typography variant="caption" color="text.secondary">
                Unique Strikes ({metadata.strikes.length})
              </Typography>
            </Box>
            <IconButton size="small">
              {strikesOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
          <Collapse in={strikesOpen}>
            <Divider sx={{ my: 1 }} />
            {Object.entries(metadata.strikes_by_name).map(
              ([name, strikes]) =>
                strikes.length > 0 && (
                  <Box key={name} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}
                    >
                      {name} ({strikes.length})
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        maxHeight: 120,
                        overflowY: "auto",
                      }}
                    >
                      {strikes.map((s) => (
                        <Chip
                          key={`${name}-${s}`}
                          label={s.toLocaleString()}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 20,
                            backgroundColor: "rgba(148, 163, 184, 0.06)",
                            color: "text.secondary",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )
            )}
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
}
