import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className = "",
      variant = "ghost",
      size = "md",
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-control transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-page disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
      secondary: "bg-surface-elevated text-primary border border-border hover:bg-border/60",
      outline: "border border-border text-primary hover:bg-surface-elevated bg-transparent",
      ghost: "text-secondary hover:text-primary hover:bg-surface-elevated bg-transparent",
    };

    const sizeStyles = {
      sm: "h-8 w-8 text-supporting",
      md: "h-9 w-9 text-body",
      lg: "h-10 w-10 text-body",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
