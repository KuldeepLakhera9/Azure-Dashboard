"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { ServiceCostItem } from "../../lib/mock-data/overview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

export interface CostByServiceChartProps {
  data: ServiceCostItem[];
}

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ServiceCostItem }>;
}

function CustomBarTooltip({ active, payload }: CustomBarTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0]?.payload;
    if (!item) return null;
    return (
      <div className="rounded-control border border-border bg-surface text-primary p-2.5 shadow-popover text-supporting font-sans">
        <p className="font-semibold text-primary">{item.serviceName}</p>
        <p className="font-mono text-accent font-bold mt-0.5">
          ${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export function CostByServiceChart({ data }: CostByServiceChartProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Cost by Azure Service</CardTitle>
        <CardDescription>
          Contribution breakdown across top resource categories (MTD).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 w-full" aria-label="Cost by Azure service chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} horizontal={false} />
              <XAxis
                type="number"
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="serviceName"
                stroke="#94A3B8"
                fontSize={11}
                width={130}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: string) => {
                  return val.length > 18 ? `${val.substring(0, 16)}...` : val;
                }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.serviceName} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Breakdown list */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          {data.slice(0, 3).map((item) => (
            <div key={item.serviceName} className="flex items-center justify-between text-supporting">
              <div className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-secondary truncate">{item.serviceName}</span>
              </div>
              <span className="font-mono text-primary font-medium shrink-0">
                ${item.cost.toFixed(2)} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
