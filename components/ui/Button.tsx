"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "solid" | "glass" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none";

const variants: Record<Variant, string> = {
  primary:
    "text-[#04121c] bg-[linear-gradient(100deg,#7ce8ee,#4c8dff)] shadow-[0_0_30px_-6px_rgba(45,214,232,0.6)] hover:shadow-[0_0_44px_-4px_rgba(76,141,255,0.75)] hover:brightness-[1.06]",
  solid: "text-ink bg-surface-3 border border-line-strong hover:bg-surface-2",
  glass: "text-ink glass hover:border-line-strong",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  outline: "text-ink border border-line-strong hover:bg-white/5",
  danger: "text-rose border border-rose/30 bg-rose/10 hover:bg-rose/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
  icon: "h-10 w-10",
};

export function buttonVariants({
  variant = "glass",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "glass", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
