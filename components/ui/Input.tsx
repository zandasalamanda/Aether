import * as React from "react";
import { cn } from "@/lib/utils";

// text-base (16px) is deliberate: iOS Safari and WKWebView zoom the whole page
// when a focused field's font-size is below 16px, which on the native shell
// leaves the app scrolled sideways. 16px also reads cleanly for older eyes.
const field =
  "inset-well w-full rounded-xl text-ink placeholder:text-faint transition-colors focus:border-accent/45 focus-visible:outline-none";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-12 px-4 text-base", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-[92px] resize-none px-4 py-3 text-base leading-relaxed", className)} {...props} />;
}
