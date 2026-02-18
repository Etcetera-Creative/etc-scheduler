"use client";

import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, isWithinInterval, getDay, addMonths } from "date-fns";

interface CalendarGridProps {
  rangeStart: Date;
  rangeEnd: Date;
  // For selectable mode (guest page)
  selectedDates?: Date[];
  onToggleDate?: (date: Date) => void;
  selectable?: boolean;
  // Only these dates are clickable (for DATE_SELECTION/DATE_TIME_SELECTION guest flow)
  enabledDates?: Date[];
  // For heatmap mode (results page)
  heatmapData?: { date: Date; count: number; names: string[] }[];
  maxCount?: number;
  // Callback when clicking a heatmap day
  onDayClick?: (date: Date) => void;
}

function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(start);
  while (current <= endOfMonth(end)) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}

export function CalendarGrid({
  rangeStart,
  rangeEnd,
  selectedDates = [],
  onToggleDate,
  selectable = false,
  enabledDates,
  heatmapData,
  maxCount = 1,
  onDayClick,
}: CalendarGridProps) {
  const months = getMonthsBetween(rangeStart, rangeEnd);

  function isInRange(date: Date) {
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  }

  function isSelected(date: Date) {
    return selectedDates.some((d) => isSameDay(d, date));
  }

  function getHeatInfo(date: Date) {
    if (!heatmapData) return null;
    return heatmapData.find((d) => isSameDay(d.date, date)) || null;
  }

  function getHeatColor(count: number) {
    if (count === 0) return "";
    const ratio = count / maxCount;
    if (ratio >= 0.8) return "bg-red-500 text-white";
    if (ratio >= 0.6) return "bg-red-400 text-white";
    if (ratio >= 0.4) return "bg-orange-400 text-white";
    if (ratio >= 0.2) return "bg-yellow-300 text-yellow-900";
    return "bg-green-300 text-green-900";
  }

  return (
    <div className="space-y-6">
      {months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const firstDayOffset = getDay(monthStart);

        return (
          <div key={monthStart.toISOString()} className="border rounded-lg p-4">
            <h3 className="text-center font-semibold mb-3">
              {format(monthStart, "MMMM yyyy")}
            </h3>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {allDaysInMonth.map((day) => {
                const inRange = isInRange(day);
                const heat = getHeatInfo(day);

                if (selectable) {
                  const selected = isSelected(day);
                  const enabled = inRange && (!enabledDates || enabledDates.some((d) => isSameDay(d, day)));
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && onToggleDate?.(day)}
                      className={`
                        p-2 text-sm rounded-md text-center transition-colors
                        ${!enabled
                          ? "text-muted-foreground/30 cursor-default"
                          : selected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent cursor-pointer"
                        }
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                }

                // View-only selected mode (individual person view)
                if (!heatmapData && selectedDates.length > 0) {
                  const selected = isSelected(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        p-2 text-sm rounded-md text-center
                        ${!inRange
                          ? "text-muted-foreground/30"
                          : selected
                            ? "bg-primary text-primary-foreground font-medium"
                            : ""
                        }
                      `}
                    >
                      {format(day, "d")}
                    </div>
                  );
                }

                // Heatmap mode
                const count = heat?.count || 0;
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => inRange && count > 0 && onDayClick?.(day)}
                    className={`
                      p-2 text-sm rounded-md text-center relative group
                      ${onDayClick && inRange && count > 0 ? "cursor-pointer" : ""}
                      ${!inRange
                        ? "text-muted-foreground/30"
                        : count > 0
                          ? getHeatColor(count)
                          : ""
                      }
                    `}
                  >
                    <div>{format(day, "d")}</div>
                    {inRange && count > 0 && (
                      <div className="text-xs opacity-75">{count}</div>
                    )}
                    {/* Tooltip */}
                    {inRange && heat && heat.names.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                          {heat.names.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
