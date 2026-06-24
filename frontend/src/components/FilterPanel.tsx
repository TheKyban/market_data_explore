"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import type { Metadata, FilterState } from "@/types";

interface FilterPanelProps {
  metadata: Metadata;
  onApplyFilters: (filters: FilterState) => void;
}

export default function FilterPanel({
  metadata,
  onApplyFilters,
}: FilterPanelProps) {
  const [instrument, setInstrument] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [strike, setStrike] = useState<string>("");
  const [name, setName] = useState<string>("");

  // Derived lists based on selected instrument
  const [availableExpiries, setAvailableExpiries] = useState<string[]>([]);
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);

  // Update available expiries and strikes when instrument changes
  useEffect(() => {
    if (instrument && metadata.expiries_by_instrument[instrument]) {
      setAvailableExpiries(metadata.expiries_by_instrument[instrument]);
    } else {
      setAvailableExpiries(metadata.expiries);
    }

    if (instrument === "FUT") {
      // FUT has no meaningful strikes
      setAvailableStrikes([]);
      setStrike("");
    } else if (instrument && metadata.strikes_by_instrument[instrument]) {
      setAvailableStrikes(metadata.strikes_by_instrument[instrument]);
    } else {
      setAvailableStrikes(metadata.strikes);
    }

    // Reset expiry and strike when instrument changes
    setExpiry("");
    setStrike("");
  }, [instrument, metadata]);

  const handleApply = useCallback(() => {
    onApplyFilters({ instrument, expiry, strike, name });
  }, [instrument, expiry, strike, name, onApplyFilters]);

  const handleClear = useCallback(() => {
    setInstrument("");
    setExpiry("");
    setStrike("");
    setName("");
    onApplyFilters({ instrument: "", expiry: "", strike: "", name: "" });
  }, [onApplyFilters]);

  const hasFilters = instrument || expiry || strike || name;

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

  return (
    <Box className="animate-fade-in-up" id="filter-panel" sx={{ animationDelay: "0.1s" }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Filters
      </Typography>

      {/* Instrument Type Toggle */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.5, display: "block" }}
        >
          Instrument Type
        </Typography>
        <ToggleButtonGroup
          value={instrument}
          exclusive
          onChange={(_e, val) => {
            if (val !== null) setInstrument(val);
            else setInstrument("");
          }}
          size="small"
          fullWidth
          id="instrument-toggle"
          sx={{
            "& .MuiToggleButton-root": {
              borderColor: "rgba(148, 163, 184, 0.15)",
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.8rem",
              py: 0.8,
              "&.Mui-selected": {
                borderColor: "primary.main",
                "&.ce-btn": {
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#34d399",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                },
                "&.pe-btn": {
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                },
                "&.fut-btn": {
                  backgroundColor: "rgba(59, 130, 246, 0.12)",
                  color: "#60a5fa",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                },
              },
            },
          }}
        >
          <ToggleButton value="CE" className="ce-btn" id="filter-ce">
            CE
          </ToggleButton>
          <ToggleButton value="PE" className="pe-btn" id="filter-pe">
            PE
          </ToggleButton>
          <ToggleButton value="FUT" className="fut-btn" id="filter-fut">
            FUT
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Symbol/Name */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="name-select-label">Symbol</InputLabel>
        <Select
          labelId="name-select-label"
          value={name}
          label="Symbol"
          onChange={(e) => setName(e.target.value)}
          id="name-select"
        >
          <MenuItem value="">
            <em>All Symbols</em>
          </MenuItem>
          {metadata.names.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Expiry */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="expiry-select-label">Expiry</InputLabel>
        <Select
          labelId="expiry-select-label"
          value={expiry}
          label="Expiry"
          onChange={(e) => setExpiry(e.target.value)}
          id="expiry-select"
          MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } } }}
        >
          <MenuItem value="">
            <em>All Expiries</em>
          </MenuItem>
          {availableExpiries.map((exp) => (
            <MenuItem key={exp} value={exp}>
              {formatExpiry(exp)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Strike (hidden for FUT) */}
      {instrument !== "FUT" && (
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="strike-select-label">Strike</InputLabel>
          <Select
            labelId="strike-select-label"
            value={strike}
            label="Strike"
            onChange={(e) => setStrike(e.target.value)}
            id="strike-select"
            MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } } }}
          >
            <MenuItem value="">
              <em>All Strikes</em>
            </MenuItem>
            {availableStrikes.map((s) => (
              <MenuItem key={s} value={String(s)}>
                {s.toLocaleString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleApply}
          startIcon={<FilterListIcon />}
          fullWidth
          id="apply-filters-btn"
          sx={{ py: 1 }}
        >
          Apply Filters
        </Button>
        <Tooltip title="Clear all filters">
          <span>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={!hasFilters}
              id="clear-filters-btn"
              sx={{ minWidth: 44, px: 1 }}
            >
              <ClearIcon />
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
