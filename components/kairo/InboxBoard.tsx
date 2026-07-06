"use client";

import * as React from "react";
import { Sparkle, Target, CalendarPlus, Archive, Plus, ChevronDown } from "lucide-react";
import type { InboxItem, InboxCategory } from "@/types";
import { sortInbox } from "@/lib/ai/sort-inbox";
import { inboxCategoryMeta, inboxCategoryOrder } from "@/lib/kairo/status";
import { SoftGlassCard } from "@/components/ui/SoftGlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { SectionLabel } from "./PageHeader";
import { cn, makeId } from "@/lib/utils";

interface LiteItem { id: string; content: string; category: InboxCategory }

export function InboxBoard({ initialItems }: { initialItems: InboxItem[] }) {
  const [items, setItems] = React.useState<LiteItem[]>(initialItems.map((i) => ({ id: i.id, content: i.content, category: i.category })));
  const [input, setInput] = React.useState("");
  const [sorting, setSorting] = React.useState(false);
  const [reasoning, setReasoning] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);

  const unsorted = items.filter((i) => i.category === "unsorted");

  const add = () => {
    const c = input.trim(); if (!c) return;
    setItems((p) => [{ id: makeId("inbox"), content: c, category: "unsorted" }, ...p]);
    setInput("");
  };
  const sortAll = async () => {
    setSorting(true); setReasoning(null);
    await new Promise((r) => setTimeout(r, 620));
    const res = await sortInbox({ items: items.map((i) => ({ id: i.id, content: i.content })) });
    const by = new Map(res.items.map((r) => [r.id, r.category]));
    setItems((p) => p.map((i) => ({ ...i, category: by.get(i.id) ?? i.category })));
    setReasoning(res.reasoning); setSorting(false);
  };
  const remove = (id: string, msg: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    setFlash(msg); window.setTimeout(() => setFlash((f) => (f === msg ? null : f)), 2200);
  };

  return (
    <div className="space-y-10">
      {/* composer */}
      <div className="space-y-3">
        <SoftGlassCard className="flex items-center gap-2 rounded-2xl p-2 pl-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Drop anything here…"
            className="h-10 flex-1 border-0 bg-transparent px-0 focus:bg-transparent"
          />
          <Button variant="solid" size="sm" onClick={add} disabled={!input.trim()}>
            <Plus size={15} /> Add
          </Button>
        </SoftGlassCard>
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-muted">{reasoning ?? `${items.length} item${items.length === 1 ? "" : "s"}`}</p>
          <Button variant="primary" size="sm" onClick={sortAll} disabled={sorting || items.length === 0}>
            <Sparkle size={14} /> {sorting ? "Sorting…" : "Sort with AI"}
          </Button>
        </div>
      </div>

      {flash && (
        <div className="rounded-xl border border-sage/25 bg-sage/5 px-4 py-2.5 text-center text-[13px] text-sage">{flash}</div>
      )}

      {items.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted">Inbox zero. Drop new thoughts above whenever they land.</p>
      ) : (
        <div className={cn("space-y-9 transition-opacity", sorting && "opacity-50")}>
          {unsorted.length > 0 && <Group items={unsorted} category="unsorted" onRemove={remove} />}
          {inboxCategoryOrder.map((cat) => {
            const list = items.filter((i) => i.category === cat);
            return list.length ? <Group key={cat} items={list} category={cat} onRemove={remove} /> : null;
          })}
        </div>
      )}
    </div>
  );
}

function Group({ items, category, onRemove }: { items: LiteItem[]; category: InboxCategory; onRemove: (id: string, msg: string) => void }) {
  const meta = inboxCategoryMeta[category];
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        <SectionLabel className={meta.text}>{meta.label}</SectionLabel>
        <span className="font-mono text-[11px] text-faint">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => <ItemBlock key={item.id} item={item} meta={meta} onRemove={onRemove} />)}
      </div>
    </section>
  );
}

function ItemBlock({ item, meta, onRemove }: { item: LiteItem; meta: { dot: string }; onRemove: (id: string, msg: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <SoftGlassCard className="rounded-xl">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
        <span className="min-w-0 flex-1 truncate text-[14px] text-ink/90">{item.content}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          <Chip tone="accent" icon={<Target size={14} />} onClick={() => onRemove(item.id, "Sent to a goal.")}>To a goal</Chip>
          <Chip tone="accent" icon={<CalendarPlus size={14} />} onClick={() => onRemove(item.id, "Added to Today.")}>To Today</Chip>
          <Chip tone="warn" icon={<Archive size={14} />} onClick={() => onRemove(item.id, "Archived.")}>Archive</Chip>
        </div>
      )}
    </SoftGlassCard>
  );
}
