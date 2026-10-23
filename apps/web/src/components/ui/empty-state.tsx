import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = <Inbox className="h-10 w-10 text-secondary/60" />,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-card border border-dashed border-border bg-surface-elevated/40 ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border shadow-sm mb-4">
        {icon}
      </div>
      <h3 className="text-section-title font-semibold text-primary">{title}</h3>
      <p className="mt-1 text-supporting text-secondary max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
