import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-supporting font-medium text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-control border bg-surface px-3 py-2 pr-9 text-body text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 disabled:bg-surface-elevated ${
              error ? "border-semantic-critical" : "border-border"
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 pointer-events-none text-secondary">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <p className="text-supporting text-semantic-critical">{error}</p>
        ) : helperText ? (
          <p className="text-supporting text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
