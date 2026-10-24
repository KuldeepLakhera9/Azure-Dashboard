"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Table, BarChart2 } from "lucide-react";
import { DailyCostPoint, TimeRangeOption } from "../../lib/mock-data/overview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export interface CostTrendChartProps {
  data: Record<TimeRangeOption, DailyCostPoint[]>;
  currency?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency?: string;
}

function CustomTooltip({ active, payload, label, currency = "USD" }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const value = payload[0]?.value ?? 0;
    return (
      <div className="rounded-control border border-border bg-surface text-primary p-2.5 shadow-popover text-supporting font-sans">
        <p className="font-medium text-secondary">{label}</p>
        <p className="font-bold text-accent text-body font-mono mt-0.5">
          ${value.toFixed(2)} {currency}
        </p>
        <span className="text-[10px] text-secondary/70">Simulated billing snapshot</span>
      </div>
    );
  }
  return null;
}

export function CostTrendChart({ data, currency = "USD" }: CostTrendChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>("mtd");
  const [showTableAlt, setShowTableAlt] = useState(false);

  const activePoints = data[selectedRange] || [];

  const rangeButtons: Array<{ id: TimeRangeOption; label: string }> = [
    { id: "7d", label: "7 Days" },
    { id: "14d", label: "14 Days" },
    { id: "mtd", label: "Month to Date" },
    { id: "30d", label: "Last 30 Days" },
  ];

  const totalRangeCost = activePoints.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Azure Cost Trend</CardTitle>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/20">
                {selectedRange.toUpperCase()}
              </span>
            </div>
            <CardDescription>
              Daily accrued consumption charges over the selected observation window ({currency}).
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Range Selector Buttons */}
            <div className="flex items-center rounded-control bg-surface-elevated p-1 border border-border">
              {rangeButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedRange(btn.id)}
                  className={`px-2.5 py-1 text-supporting font-medium rounded-md transition-colors cursor-pointer ${
                    selectedRange === btn.id
                      ? "bg-surface text-primary shadow-sm"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Accessible Table Alternative Toggle */}
            <Button
              variant="outline"
              size="sm"
              aria-label={showTableAlt ? "Show Chart View" : "Show Table View"}
              title={showTableAlt ? "Show Chart View" : "Show Table View"}
              onClick={() => setShowTableAlt(!showTableAlt)}
            >
              {showTableAlt ? (
                <BarChart2 className="h-4 w-4" />
              ) : (
                <Table className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between text-supporting pb-2 border-b border-border/60">
          <div>
            <span className="text-secondary">Range Total: </span>
            <span className="font-bold text-primary font-mono text-body">
              ${totalRangeCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-secondary/70 text-[11px] font-mono">
            Source: 24h Cost Management Cache
          </span>
        </div>

        {showTableAlt ? (
          <div className="max-h-64 overflow-y-auto rounded-control border border-border">
            <table className="w-full text-left text-supporting">
              <thead className="bg-surface-elevated text-secondary font-medium border-b border-border">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Accrued Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {activePoints.map((point) => (
                  <tr key={point.date} className="hover:bg-surface-elevated/40">
                    <td className="py-2 px-3 text-primary">{point.date}</td>
                    <td className="py-2 px-3 text-right text-primary">
                      ${point.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 w-full" aria-label="Cost trend interactive chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="azureCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#94A3B8", opacity: 0.2 }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#azureCostGrad)"
                  activeDot={{ r: 5, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
