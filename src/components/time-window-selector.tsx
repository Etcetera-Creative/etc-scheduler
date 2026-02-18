"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import type { TimeWindow } from "@/components/time-window-editor";

interface TimeWindowSelectorProps {
  date: Date;
  plannerWindows: TimeWindow[];
  desiredDuration: number | null;
  guestWindows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}${m > 0 ? `:${m.toString().padStart(2, "0")}` : ""}${ampm}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${h} hr${h > 1 ? "s" : ""} ${m} min`;
}

export function TimeWindowSelector({
  date,
  plannerWindows,
  desiredDuration,
  guestWindows,
  onChange,
}: TimeWindowSelectorProps) {
  function addWindow() {
    const first = plannerWindows[0] || { start: "09:00", end: "17:00" };
    onChange([...guestWindows, { start: first.start, end: first.end }]);
  }

  function removeWindow(index: number) {
    onChange(guestWindows.filter((_, i) => i !== index));
  }

  function updateWindow(index: number, field: "start" | "end", value: string) {
    const updated = [...guestWindows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function setAllDay() {
    onChange([{ start: "00:00", end: "23:59" }]);
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-medium">{format(date, "EEE, MMM d, yyyy")}</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          Planner is available:{" "}
          {plannerWindows.map((w, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {formatTime(w.start)}–{formatTime(w.end)}
            </span>
          ))}
        </p>
        {desiredDuration && (
          <p>Looking for: {formatDuration(desiredDuration)}</p>
        )}
      </div>

      {guestWindows.map((w, i) => {
        const invalid = w.start && w.end && w.start >= w.end;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={w.start}
                onChange={(e) => updateWindow(i, "start", e.target.value)}
                className={`w-32 ${invalid ? "border-destructive" : ""}`}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={w.end}
                onChange={(e) => updateWindow(i, "end", e.target.value)}
                className={`w-32 ${invalid ? "border-destructive" : ""}`}
              />
              {guestWindows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => removeWindow(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {invalid && (
              <p className="text-xs text-destructive">Start time must be before end time</p>
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={addWindow}>
          <Plus className="h-4 w-4 mr-1" /> Add Window
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={setAllDay}>
          All Day
        </Button>
      </div>
    </div>
  );
}
