"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

export interface TimeWindow {
  start: string; // "HH:mm"
  end: string;
}

interface TimeWindowEditorProps {
  date: Date;
  windows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
}

export function TimeWindowEditor({ date, windows, onChange }: TimeWindowEditorProps) {
  function addWindow() {
    onChange([...windows, { start: "09:00", end: "17:00" }]);
  }

  function removeWindow(index: number) {
    onChange(windows.filter((_, i) => i !== index));
  }

  function updateWindow(index: number, field: "start" | "end", value: string) {
    const updated = [...windows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function setAllDay() {
    onChange([{ start: "00:00", end: "23:59" }]);
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{format(date, "EEE, MMM d, yyyy")}</h4>
        <Button type="button" variant="outline" size="sm" onClick={setAllDay}>
          All Day
        </Button>
      </div>

      {windows.map((w, i) => {
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
              {windows.length > 1 && (
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

      <Button type="button" variant="ghost" size="sm" onClick={addWindow}>
        <Plus className="h-4 w-4 mr-1" /> Add Window
      </Button>
    </div>
  );
}
