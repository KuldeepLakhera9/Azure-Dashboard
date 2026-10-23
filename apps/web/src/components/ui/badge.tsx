import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "critical" | "info" | "outline";
}

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-supporting font-medium transition-colors";

  const variantStyles = {
    default: "bg-surface-elevated text-secondary border border-border",
    success:
      "bg-semantic-success-bg text-semantic-success border border-semantic-success/20",
    warning:
      "bg-semantic-warning-bg text-semantic-warning border border-semantic-warning/20",
    critical:
      "bg-semantic-critical-bg text-semantic-critical border border-semantic-critical/20",
    info: "bg-semantic-info-bg text-semantic-info border border-semantic-info/20",
    outline: "text-secondary border border-border bg-transparent",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
