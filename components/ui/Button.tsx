"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "solid" | "glass" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight select-none disabled:opacity-40 disabled:pointer-events-none";

/**
 * Expands the tappable box to Apple's 44pt minimum without changing how the
 * control looks. Only used where growing the button itself would upset a dense
 * layout. `base` already sets `relative`, and the parent must not clip overflow.
 */
const hitArea = "before:absolute before:-inset-2 before:content-['']";

const variants: Record<Variant, string> = {
  // The one accent action ("your next move"). Used once per view at most.
  primary: "raised-gold",
  solid: "raised-btn text-ink",
  glass: "raised-btn text-ink",
  ghost: "text-muted transition-colors hover:text-ink hover:bg-white/5",
  outline: "raised-btn text-ink",
  danger: "raised-btn text-warn",
};

const sizes: Record<Size, string> = {
  // sm stays visually small (it sits in the landing header and inside input
  // wells) so the hit area grows instead: 32px box, 48px tappable.
  sm: `h-8 rounded-lg px-3.5 text-[14px] ${hitArea}`,
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-11 w-11",
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
