"use client";

import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDay, addMonths, isWithinInterval } from "date-fns";

interface Person {
  id: string;
  name: string;
  dates: Date[];
  color: string;
}

interface ComparisonCalendarProps {
  rangeStart: Date;
  rangeEnd: Date;
  people: Person[];
}

const PERSON_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-500" },
  { bg: "bg-red-500", text: "text-red-500" },
  { bg: "bg-green-500", text: "text-green-500" },
  { bg: "bg-purple-500", text: "text-purple-500" },
  { bg: "bg-orange-500", text: "text-orange-500" },
  { bg: "bg-pink-500", text: "text-pink-500" },
  { bg: "bg-cyan-500", text: "text-cyan-500" },
  { bg: "bg-yellow-500", text: "text-yellow-500" },
];

export function getPersonColor(index: number) {
  return PERSON_COLORS[index % PERSON_COLORS.length];
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

export function ComparisonCalendar({ rangeStart, rangeEnd, people }: ComparisonCalendarProps) {
  const months = getMonthsBetween(rangeStart, rangeEnd);

  function isInRange(date: Date) {
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  }

  function getPeopleOnDate(date: Date): Person[] {
    return people.filter((person) =>
      person.dates.some((d) => isSameDay(d, date))
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pb-4 border-b">
        {people.map((person, index) => {
          const colors = getPersonColor(index);
          return (
            <div key={person.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <span className="text-sm font-medium">{person.name}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar */}
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
                const availablePeople = getPeopleOnDate(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      p-2 text-sm rounded-md text-center min-h-[60px] flex flex-col items-center justify-start gap-1
                      ${!inRange ? "text-muted-foreground/30" : ""}
                    `}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    {inRange && availablePeople.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {availablePeople.map((person) => {
                          const personIndex = people.findIndex((p) => p.id === person.id);
                          const colors = getPersonColor(personIndex);
                          return (
                            <div
                              key={person.id}
                              className={`w-2 h-2 rounded-full ${colors.bg}`}
                              title={person.name}
                            />
                          );
                        })}
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
