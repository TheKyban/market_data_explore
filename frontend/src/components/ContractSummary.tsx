"use client";

import { TrendingUp, CalendarDays, Tags } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "@/types";

interface ContractSummaryProps {
  metadata: Metadata;
}

export default function ContractSummary({ metadata }: ContractSummaryProps) {
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
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
      <h3 className="font-semibold text-sm text-foreground">Contract Summary</h3>

      {/* Row count */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Records</p>
          <p className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
            {metadata.total_rows.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Contract counts by instrument */}
      <div className="grid grid-cols-3 gap-2">
        {(["CE", "PE", "FUT"] as const).map((inst) => {
          const colorClass =
            inst === "CE"
              ? "from-emerald-400 to-emerald-600"
              : inst === "PE"
              ? "from-rose-400 to-rose-600"
              : "from-blue-400 to-blue-600";
          const count = metadata.contract_counts[inst] || 0;
          return (
            <Card key={inst} className="bg-card/50">
              <CardContent className="p-3 text-center flex flex-col items-center justify-center">
                <Badge
                  variant="outline"
                  className={`mb-2 ${
                    inst === "CE"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : inst === "PE"
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}
                >
                  {inst}
                </Badge>
                <p className={`text-xl font-bold bg-gradient-to-br ${colorClass} bg-clip-text text-transparent`}>
                  {count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Symbols */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Symbols ({metadata.names.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metadata.names.map((name) => (
              <Badge key={name} variant="secondary" className="font-normal text-[11px] px-2 py-0 h-6">
                {name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expiries & Strikes Accordion */}
      <Accordion className="w-full space-y-3">
        <AccordionItem value="expiries" className="border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Expiries ({metadata.expiries.length})
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <Separator className="mb-4" />
            <div className="space-y-4">
              {Object.entries(metadata.expiries_by_instrument).map(
                ([inst, expiries]) => (
                  <div key={inst}>
                    <Badge
                      variant="outline"
                      className={`mb-2 ${
                        inst === "CE"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : inst === "PE"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}
                    >
                      {inst}
                    </Badge>
                    <div className="flex flex-wrap gap-1.5">
                      {expiries.map((exp) => (
                        <Badge key={`${inst}-${exp}`} variant="secondary" className="font-normal text-[10px] px-1.5 py-0 h-5">
                          {formatExpiry(exp)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="strikes" className="border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-amber-500/70" />
              <p className="text-xs font-medium text-muted-foreground">
                Unique Strikes ({metadata.strikes.length})
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <Separator className="mb-4" />
            <div className="space-y-4">
              {Object.entries(metadata.strikes_by_name).map(
                ([name, strikes]) =>
                  strikes.length > 0 && (
                    <div key={name}>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                        {name} ({strikes.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {strikes.map((s) => (
                          <Badge key={`${name}-${s}`} variant="secondary" className="font-normal text-[10px] px-1.5 py-0 h-5">
                            {s.toLocaleString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
