"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { TimeWindow } from "@/components/time-window-editor";

interface TimeHeatmapBarProps {
  date: Date;
  plannerWindows: TimeWindow[];
  guestEntries: { guestName: string; windows: TimeWindow[] }[];
  onClose: () => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${min.toString().padStart(2, "0")}${ampm}`;
}

function formatWindowLabel(w: TimeWindow): string {
  return `${minutesToTime(timeToMinutes(w.start))}–${minutesToTime(timeToMinutes(w.end))}`;
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return "bg-muted";
  const ratio = count / max;
  if (ratio >= 0.8) return "bg-red-500";
  if (ratio >= 0.6) return "bg-red-400";
  if (ratio >= 0.4) return "bg-orange-400";
  if (ratio >= 0.2) return "bg-yellow-300";
  return "bg-green-300";
}

function isInWindows(startMin: number, endMin: number, windows: TimeWindow[]): boolean {
  for (const w of windows) {
    const wStart = timeToMinutes(w.start);
    const wEnd = timeToMinutes(w.end);
    if (startMin >= wStart && endMin <= wEnd) return true;
  }
  return false;
}

export function TimeHeatmapBar({ date, plannerWindows, guestEntries, onClose }: TimeHeatmapBarProps) {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  const BLOCK_SIZE = 15;
  const TOTAL_BLOCKS = (24 * 60) / BLOCK_SIZE;

  // Build 15-minute blocks for the full day
  const blocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({
    startMin: i * BLOCK_SIZE,
    endMin: (i + 1) * BLOCK_SIZE,
  }));

  // Planner bar: which blocks fall in planner windows
  const plannerBlocks = blocks.map((b) => isInWindows(b.startMin, b.endMin, plannerWindows));

  // Guest bar: count overlaps for ALL blocks (unfiltered)
  const blockData = blocks.map((block) => {
    const names: string[] = [];
    for (const entry of guestEntries) {
      for (const gw of entry.windows) {
        const gStart = timeToMinutes(gw.start);
        const gEnd = timeToMinutes(gw.end);
        if (gStart < block.endMin && gEnd > block.startMin) {
          names.push(entry.guestName);
          break;
        }
      }
    }
    return { ...block, count: names.length, names };
  });

  const maxCount = Math.max(...blockData.map((b) => b.count), 1);

  const hourLabels = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const selected = selectedBlock !== null ? blockData[selectedBlock] : null;

  const plannerLabel = plannerWindows.map(formatWindowLabel).join(", ");

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{format(date, "EEE, MMM d")}</h4>
          <p className="text-xs text-muted-foreground">Planner requested: {plannerLabel}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
          ✕ Close
        </button>
      </div>

      {/* Planner desired window bar (thin reference strip) */}
      <div className="flex gap-px rounded overflow-hidden">
        {plannerBlocks.map((inWindow, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 ${inWindow ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
          />
        ))}
      </div>

      {/* Guest response bar (main bar, unfiltered) */}
      <div className="flex gap-px rounded overflow-hidden">
        {blockData.map((block, i) => (
          <button
            key={i}
            type="button"
            className={`relative flex-1 h-10 transition-colors ${
              getHeatColor(block.count, maxCount)
            } ${selectedBlock === i ? "ring-2 ring-primary ring-inset" : ""}`}
            onClick={() => setSelectedBlock(selectedBlock === i ? null : i)}
          />
        ))}
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        {hourLabels.map((h) => (
          <span key={h}>{h === 0 ? "12a" : h === 12 ? "12p" : h === 24 ? "12a" : h > 12 ? `${h - 12}p` : `${h}a`}</span>
        ))}
      </div>

      {/* Selected block detail */}
      {selected && (
        <div className="text-sm border rounded p-3 bg-accent/50 space-y-1">
          <div className="font-medium">
            {minutesToTime(selected.startMin)} – {minutesToTime(selected.endMin)}
          </div>
          {selected.count > 0 ? (
            <div className="text-muted-foreground">
              {selected.count} available: {selected.names.join(", ")}
            </div>
          ) : (
            <div className="text-muted-foreground">No one available</div>
          )}
        </div>
      )}
    </div>
  );
}
