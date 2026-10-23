import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "An error occurred",
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-card border border-semantic-critical/20 bg-semantic-critical-bg p-6 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-semantic-critical/30 text-semantic-critical mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-section-title font-semibold text-semantic-critical">
        {title}
      </h3>
      <p className="mt-1 text-supporting text-secondary max-w-md">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}
