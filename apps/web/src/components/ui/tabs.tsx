import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div className={`border-b border-border ${className}`}>
      <nav className="flex space-x-6" aria-label="Tabs">
        {items.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-body font-medium transition-colors cursor-pointer ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-secondary hover:text-primary hover:border-border"
              }`}
            >
              {tab.icon && (
                <span
                  className={
                    isActive
                      ? "text-accent"
                      : "text-secondary group-hover:text-primary"
                  }
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-supporting font-semibold ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "bg-surface-elevated text-secondary"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
