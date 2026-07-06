"use client";

import * as React from "react";
import type { GoalWithNodes, GoalNode } from "@/types";
import { nodeStatusMeta } from "@/lib/kairo/status";
import { cn } from "@/lib/utils";

const W = 800;
const H = 640;
const CX = 400;
const CY = 300;
const R = 224;

function nextNodeId(nodes: GoalNode[]): string | null {
  return (
    nodes.find((n) => n.status === "in_motion")?.id ??
    nodes.find((n) => n.status === "at_risk")?.id ??
    nodes.find((n) => n.status === "not_started")?.id ??
    null
  );
}

function polar(i: number, count: number) {
  const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle), angle };
}

export function LivingGoalMap({
  goal,
  selectedId,
  onSelect,
  className,
}: {
  goal: GoalWithNodes;
  selectedId?: string | null;
  onSelect?: (node: GoalNode) => void;
  className?: string;
}) {
  const nodes = goal.nodes;
  const nextId = nextNodeId(nodes);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", className)} role="img" aria-label={`Living map for ${goal.title}`}>
      <defs>
        <radialGradient id="lm-core" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#2dd6e8" />
          <stop offset="100%" stopColor="#0a1220" />
        </radialGradient>
        <radialGradient id="lm-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(45,214,232,0.55)" />
          <stop offset="100%" stopColor="rgba(45,214,232,0)" />
        </radialGradient>
        <linearGradient id="lm-link" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(45,214,232,0.65)" />
          <stop offset="100%" stopColor="rgba(154,124,255,0.15)" />
        </linearGradient>
      </defs>

      {/* connectors */}
      {nodes.map((node, i) => {
        const { x, y, angle } = polar(i, nodes.length);
        const ctrlR = R * 0.52;
        const cxp = CX + ctrlR * Math.cos(angle + 0.4);
        const cyp = CY + ctrlR * Math.sin(angle + 0.4);
        const isNext = node.id === nextId;
        const done = node.status === "done";
        return (
          <path
            key={`link-${node.id}`}
            d={`M ${CX} ${CY} Q ${cxp} ${cyp} ${x} ${y}`}
            fill="none"
            stroke={done ? "rgba(76,141,255,0.5)" : "url(#lm-link)"}
            strokeWidth={isNext ? 2.4 : 1.5}
            strokeLinecap="round"
            strokeDasharray={isNext ? "5 7" : undefined}
            className={isNext ? "animate-dash" : undefined}
            opacity={node.status === "not_started" ? 0.5 : 0.9}
          />
        );
      })}

      {/* core */}
      <circle cx={CX} cy={CY} r={120} fill="url(#lm-core-glow)" className="animate-pulse-glow" />
      <circle cx={CX} cy={CY} r={54} fill="url(#lm-core)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
      <text x={CX} y={CY - 4} textAnchor="middle" className="fill-[#04121c] font-[var(--font-display)]" fontSize="26" fontWeight="700">
        {Math.round(goal.progress)}%
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="fill-[#0a1a2a]" fontSize="10" fontWeight="600" letterSpacing="1.5">
        IN MOTION
      </text>

      {/* nodes */}
      {nodes.map((node, i) => {
        const { x, y } = polar(i, nodes.length);
        const meta = nodeStatusMeta[node.status];
        const isNext = node.id === nextId;
        const selected = node.id === selectedId;
        const done = node.status === "done";
        const rNode = 26;
        const circ = 2 * Math.PI * (rNode + 6);
        const offset = circ * (1 - Math.max(0, Math.min(100, node.progress)) / 100);
        return (
          <g
            key={node.id}
            transform={`translate(${x}, ${y})`}
            onClick={() => onSelect?.(node)}
            className="cursor-pointer"
            role="button"
            aria-label={`${node.title} — ${meta.label}`}
          >
            {/* halo / selection ring */}
            {(isNext || selected) && (
              <circle r={rNode + 12} fill="none" stroke={meta.hex} strokeWidth={selected ? 2 : 1.5} opacity={0.5} className={isNext ? "animate-pulse-glow" : undefined} />
            )}
            {/* progress arc */}
            <circle r={rNode + 6} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
            <circle
              r={rNode + 6}
              fill="none"
              stroke={meta.hex}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90)"
              style={{ filter: `drop-shadow(0 0 4px ${meta.hex}99)` }}
            />
            {/* body */}
            <circle
              r={rNode}
              fill={done ? meta.hex : "rgba(14,20,32,0.92)"}
              stroke={meta.hex}
              strokeWidth={1.5}
              style={{ filter: done ? `drop-shadow(0 0 10px ${meta.hex}88)` : undefined }}
              opacity={node.status === "not_started" ? 0.9 : 1}
            />
            <circle r={5} cx={0} cy={0} fill={meta.hex} opacity={done ? 0 : 1} />

            {/* label */}
            <foreignObject x={-70} y={rNode + 12} width={140} height={56} style={{ overflow: "visible" }}>
              <div className="text-center leading-tight">
                <div className={cn("truncate text-[12.5px] font-medium", selected ? "text-ink" : "text-ink/90")}>{node.title}</div>
                <div className="mt-0.5 font-mono text-[10px] tracking-wide" style={{ color: meta.hex }}>
                  {node.estimatedMinutes}m · {meta.label}
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
