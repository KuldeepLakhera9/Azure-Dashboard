import React from "react";

export type StatusType = "success" | "warning" | "critical" | "info" | "offline";

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className = "",
}: StatusIndicatorProps) {
  const dotColor = {
    success: "bg-semantic-success",
    warning: "bg-semantic-warning",
    critical: "bg-semantic-critical",
    info: "bg-semantic-info",
    offline: "bg-secondary",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && status === "success" && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColor[status]}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${dotColor[status]}`}
        />
      </span>
      {label && (
        <span className="text-supporting font-medium text-secondary capitalize">
          {label}
        </span>
      )}
    </div>
  );
}
