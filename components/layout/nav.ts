import { Sunrise, Waypoints, Inbox, Activity, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/app/today", label: "Today", icon: Sunrise },
  { href: "/app/map", label: "Map", icon: Waypoints },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/review", label: "Review", icon: Activity },
];
