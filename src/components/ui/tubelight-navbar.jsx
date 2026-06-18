import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

// Controlled "tubelight" tab bar — adapted from the floating bottom-nav pattern
// (ayushmxxn/tubelight-navbar) into an inline, parent-controlled tab strip so
// it can drive existing page state instead of owning its own active-tab state.
export function TubelightNavbar({ items, activeKey, onChange, className, layoutId = "tubelight" }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center flex-wrap gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-zinc-200 dark:bg-zinc-900 border border-zinc-300/50 dark:border-white/5 w-full",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            title={item.label}
            className={cn(
              "relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors overflow-hidden",
              isActive
                ? "text-white shadow-lg shadow-red-600/25"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
            )}
            style={isActive ? { background: gradient } : {}}
          >
            {Icon && <Icon className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />}
            <span className="hidden sm:inline">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full -z-10 shadow-lg shadow-red-600/20"
                style={{ background: gradient }}
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full"
                  style={{ background: "#ef4136" }}
                >
                  <div
                    className="absolute w-12 h-6 rounded-full blur-md -top-2 -left-2"
                    style={{ background: "rgba(239,65,54,0.45)" }}
                  />
                  <div
                    className="absolute w-8 h-6 rounded-full blur-md -top-1"
                    style={{ background: "rgba(239,65,54,0.4)" }}
                  />
                  <div
                    className="absolute w-4 h-4 rounded-full blur-sm top-0 left-2"
                    style={{ background: "rgba(251,176,64,0.5)" }}
                  />
                </div>
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}
