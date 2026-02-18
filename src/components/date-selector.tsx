"use client";

import { CalendarGrid } from "@/components/calendar-grid";
import { isSameDay } from "date-fns";

interface DateSelectorProps {
  rangeStart: Date;
  rangeEnd: Date;
  selectedDates: Date[];
  onToggle: (date: Date) => void;
}

export function DateSelector({ rangeStart, rangeEnd, selectedDates, onToggle }: DateSelectorProps) {
  return (
    <div className="space-y-2">
      <CalendarGrid
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        selectedDates={selectedDates}
        onToggleDate={onToggle}
        selectable
      />
      <p className="text-xs text-muted-foreground">
        {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
