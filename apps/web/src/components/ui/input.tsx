import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-supporting font-medium text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-secondary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-control border bg-surface px-3 py-2 text-body text-primary placeholder-secondary/60 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 disabled:bg-surface-elevated ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-9" : ""} ${
              error ? "border-semantic-critical" : "border-border"
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-secondary">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";
