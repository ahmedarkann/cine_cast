import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function AuthPageLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white">
      {/* Back Button */}
      <Link
        to="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 z-50 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] px-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 dark:text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        {footer && <p className="px-8 text-center text-sm text-zinc-500 dark:text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}