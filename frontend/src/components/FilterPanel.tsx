"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Metadata, FilterState } from "@/types";

interface FilterPanelProps {
  metadata: Metadata;
  onApplyFilters: (filters: FilterState) => void;
}

export default function FilterPanel({
  metadata,
  onApplyFilters,
}: FilterPanelProps) {
  const [instrument, setInstrument] = useState<string>("all");
  const [expiry, setExpiry] = useState<string>("all");
  const [strike, setStrike] = useState<string>("all");
  const [name, setName] = useState<string>("all");

  const [availableExpiries, setAvailableExpiries] = useState<string[]>([]);
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);

  useEffect(() => {
    const inst = instrument === "all" ? "" : instrument;
    if (inst && metadata.expiries_by_instrument[inst]) {
      setAvailableExpiries(metadata.expiries_by_instrument[inst]);
    } else {
      setAvailableExpiries(metadata.expiries);
    }

    if (inst === "FUT") {
      setAvailableStrikes([]);
      setStrike("all");
    } else if (inst && metadata.strikes_by_instrument[inst]) {
      setAvailableStrikes(metadata.strikes_by_instrument[inst]);
    } else {
      setAvailableStrikes(metadata.strikes);
    }

    setExpiry("all");
    setStrike("all");
  }, [instrument, metadata]);

  const handleApply = useCallback(() => {
    onApplyFilters({
      instrument: instrument === "all" ? "" : instrument,
      expiry: expiry === "all" ? "" : expiry,
      strike: strike === "all" ? "" : strike,
      name: name === "all" ? "" : name,
    });
  }, [instrument, expiry, strike, name, onApplyFilters]);

  const handleClear = useCallback(() => {
    setInstrument("all");
    setExpiry("all");
    setStrike("all");
    setName("all");
    onApplyFilters({ instrument: "", expiry: "", strike: "", name: "" });
  }, [onApplyFilters]);

  const hasFilters = instrument !== "all" || expiry !== "all" || strike !== "all" || name !== "all";

  const formatExpiry = (exp: string) => {
    if (exp === "all") return "All Expiries";
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
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="font-semibold text-sm text-foreground">Filters</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Instrument Type</label>
        <ToggleGroup
          value={[instrument]}
          onValueChange={(val) => {
            const newVal = val[0];
            if (newVal) setInstrument(newVal);
            else setInstrument("all");
          }}
          className="justify-start w-full"
        >
          <ToggleGroupItem value="CE" className="flex-1 data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400">
            CE
          </ToggleGroupItem>
          <ToggleGroupItem value="PE" className="flex-1 data-[state=on]:bg-rose-500/20 data-[state=on]:text-rose-500 hover:bg-rose-500/10 hover:text-rose-400">
            PE
          </ToggleGroupItem>
          <ToggleGroupItem value="FUT" className="flex-1 data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-500 hover:bg-blue-500/10 hover:text-blue-400">
            FUT
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Symbol</label>
        <Select value={name} onValueChange={(val) => val && setName(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Symbols">
              {name === "all" ? "All Symbols" : name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Symbols</SelectItem>
            {metadata?.names.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Expiry</label>
        <Select value={expiry} onValueChange={(val) => val && setExpiry(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Expiries">
              {expiry === "all" ? "All Expiries" : formatExpiry(expiry)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expiries</SelectItem>
            {availableExpiries.map((e) => (
              <SelectItem key={e} value={e}>
                {formatExpiry(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {instrument !== "fut" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">Strike</label>
          <Select value={strike} onValueChange={(val) => val && setStrike(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Strikes">
                {strike === "all" ? "All Strikes" : Number(strike).toLocaleString()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strikes</SelectItem>
              {availableStrikes.map((s) => (
                <SelectItem key={s} value={s.toString()}>
                  {s.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleApply} className="flex-1" variant="default">
          <Filter className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={!hasFilters}
          title="Clear all filters"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
