"use client";

import * as React from "react";
import { Waypoints, List, MessageCircle } from "lucide-react";
import type { GoalWithNodes } from "@/types";
import { GalaxyMap } from "./GalaxyMap";
import { GoalList } from "./GoalList";
import { AskSola } from "./AskSola";
import { FirstRunTour } from "./FirstRunTour";
import { usePersistentState } from "@/lib/store/persist";
import { cn } from "@/lib/utils";

/** The map surface with a Galaxy ↔ List toggle (spatial view + linear view). */
export function MapView({ goals, initialGoalId, remote, isPro }: { goals: GoalWithNodes[]; initialGoalId?: string; remote: boolean; isPro: boolean }) {
  const [view, setView] = usePersistentState<"galaxy" | "list">("kairo.mapview.v1", "galaxy");
  const [openId, setOpenId] = React.useState<string | undefined>(initialGoalId);
  const [askOpen, setAskOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const openInGalaxy = (id: string) => { setOpenId(id); setView("galaxy"); };
  // Hide Ask Sola whenever ANY map sheet is open, not just a node sheet. The button
  // is anchored above the bottom nav, which is exactly where those sheets put their
  // submit buttons, so it used to sit on top of them: typing a step and tapping Add
  // opened the Ask Sola panel instead. GalaxyMap now reports every sheet, not only
  // the node one.
  const askHidden = askOpen || (view === "galaxy" && sheetOpen);

  return (
    <div className="absolute inset-0">
      <FirstRunTour />
      {view === "galaxy" ? (
        <GalaxyMap key={openId ?? "root"} goals={goals} initialGoalId={openId} remote={remote} isPro={isPro} onSheetChange={setSheetOpen} />
      ) : (
        <div className="absolute inset-0 overflow-y-auto">
          <GoalList goals={goals} onOpen={openInGalaxy} />
        </div>
      )}

      {/* Centred on desktop, but right-aligned on phones. Centring put this pill
          directly on top of the goal-title switcher, which is left-aligned in the
          map's own top row: at 375px the two overlapped by about 15px, so the right
          edge of the goal name was untappable and hitting it switched view instead
          of opening the goal menu. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end pr-3 pt-[max(12px,var(--sa-top))] md:justify-center md:pr-0 md:pt-5">
        <div className="chrome pointer-events-auto inline-flex gap-1 rounded-full p-1">
          {([["galaxy", Waypoints, "Map"], ["list", List, "List"]] as const).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors md:min-h-0 md:py-1.5", view === v ? "raised-btn text-ink" : "text-muted hover:text-ink")}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ask Sola — plan assistant. Free users get a couple of tries a day (metered
          server-side); Pro is uncapped. Hidden while a node sheet covers it. */}
      {goals.length > 0 && !askHidden && (
        <button
          onClick={() => setAskOpen(true)}
          className="raised-gold absolute bottom-[calc(96px+var(--sa-bottom))] right-4 z-40 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-medium md:bottom-6"
        >
          <MessageCircle size={16} /> Ask Sola
          {!isPro && <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase">Free</span>}
        </button>
      )}
      {askOpen && <AskSola goals={goals} remote={remote} isPro={isPro} onClose={() => setAskOpen(false)} />}
    </div>
  );
}
