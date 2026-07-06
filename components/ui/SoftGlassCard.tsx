import * as React from "react";
import { cn } from "@/lib/utils";

interface SoftGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** adds a subtle top glow accent */
  glow?: "none" | "blue" | "cyan" | "violet";
  as?: "div" | "section" | "article";
}

const glowMap = {
  none: "",
  blue: "before:bg-blue/60",
  cyan: "before:bg-cyan/60",
  violet: "before:bg-violet/60",
} as const;

export function SoftGlassCard({
  className,
  glow = "none",
  as: Tag = "div",
  children,
  ...props
}: SoftGlassCardProps) {
  return (
    <Tag
      className={cn(
        "glass relative overflow-hidden rounded-2xl",
        glow !== "none" &&
          "before:absolute before:inset-x-8 before:-top-px before:h-px before:blur-[1px] before:content-['']",
        glow !== "none" && glowMap[glow],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
