"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CalendarCheck, Clock } from "lucide-react";

export type PlanMode = "DATE_RANGE" | "DATE_SELECTION" | "DATE_TIME_SELECTION";

interface ModeSelectorProps {
  value: PlanMode;
  onChange: (mode: PlanMode) => void;
}

const MODES: { mode: PlanMode; icon: React.ReactNode; title: string; description: string }[] = [
  {
    mode: "DATE_RANGE",
    icon: <CalendarDays className="h-6 w-6" />,
    title: "Date Range",
    description: "Select a start and end date. Guests pick which days work.",
  },
  {
    mode: "DATE_SELECTION",
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Date Selection",
    description: "Select a date range, then pick specific days. Guests choose from those days.",
  },
  {
    mode: "DATE_TIME_SELECTION",
    icon: <Clock className="h-6 w-6" />,
    title: "Date & Time Selection",
    description: "Select specific days and time windows. Guests pick days and times.",
  },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid gap-3">
      {MODES.map(({ mode, icon, title, description }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className="text-left"
        >
          <Card
            className={`transition-colors cursor-pointer ${
              value === mode
                ? "border-primary bg-primary/5"
                : "hover:bg-accent"
            }`}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className={`mt-0.5 ${value === mode ? "text-primary" : "text-muted-foreground"}`}>
                {icon}
              </div>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
