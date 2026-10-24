"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { ResourceCategoryItem } from "../../lib/mock-data/overview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

export interface ResourceDistributionChartProps {
  data: ResourceCategoryItem[];
}

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ResourceCategoryItem }>;
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0]?.payload;
    if (!item) return null;
    return (
      <div className="rounded-control border border-border bg-surface text-primary p-2.5 shadow-popover text-supporting font-sans">
        <p className="font-semibold text-primary">{item.category}</p>
        <p className="text-accent font-mono mt-0.5">
          {item.count} Resources ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export function ResourceDistributionChart({ data }: ResourceDistributionChartProps) {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Resource Distribution</CardTitle>
        <CardDescription>
          Category distribution across provisioned Azure workload types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-60 w-full" aria-label="Resource status distribution donut chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-primary font-mono">{totalCount}</span>
            <span className="text-supporting text-secondary uppercase tracking-wider text-[10px]">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
          {data.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-supporting">
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-secondary truncate">{item.category}</span>
              </div>
              <span className="font-mono font-medium text-primary shrink-0">
                {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
