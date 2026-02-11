"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, eachDayOfInterval, parseISO, isSameDay } from "date-fns";

interface ResponseData {
  id: string;
  guestName: string;
  selectedDates: string[];
}

interface PlanWithResponses {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  responses: ResponseData[];
}

export default function ResultsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [plan, setPlan] = useState<PlanWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/plans/${slug}/results`);
      if (res.ok) {
        setPlan(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Plan not found.</p>
      </div>
    );
  }

  const allDays = eachDayOfInterval({
    start: parseISO(plan.startDate),
    end: parseISO(plan.endDate),
  });

  // Count availability per day
  const dateCounts: { date: Date; count: number; names: string[] }[] = allDays.map((day) => {
    const names: string[] = [];
    for (const r of plan.responses) {
      if (r.selectedDates.some((d) => isSameDay(parseISO(d), day))) {
        names.push(r.guestName);
      }
    }
    return { date: day, count: names.length, names };
  });

  const maxCount = Math.max(...dateCounts.map((d) => d.count), 1);

  // Group by weeks
  const weeks: (typeof dateCounts[0] | null)[][] = [];
  let currentWeek: (typeof dateCounts[0] | null)[] = [];
  const firstDayOfWeek = allDays[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null);
  for (const dc of dateCounts) {
    currentWeek.push(dc);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/plan/${plan.slug}` : "";

  function getHeatColor(count: number) {
    if (count === 0) return "";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "bg-green-500 text-white";
    if (intensity > 0.5) return "bg-green-400 text-white";
    if (intensity > 0.25) return "bg-green-300";
    return "bg-green-200";
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{plan.name}</h1>
          {plan.description && (
            <p className="text-muted-foreground mt-1">{plan.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied!" : "Copy Share Link"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability Heatmap</CardTitle>
          <CardDescription>
            {plan.responses.length} response{plan.responses.length !== 1 ? "s" : ""} ·
            Darker green = more people available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((dc, di) =>
                dc ? (
                  <div
                    key={di}
                    className={`p-2 text-sm rounded-md text-center relative group cursor-default ${getHeatColor(dc.count)}`}
                    title={dc.names.length > 0 ? dc.names.join(", ") : "No one available"}
                  >
                    <div>{format(dc.date, "d")}</div>
                    {dc.count > 0 && (
                      <div className="text-xs opacity-75">{dc.count}</div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap">
                        {dc.names.length > 0 ? dc.names.join(", ") : "No one"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={di} />
                )
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {plan.responses.length === 0 ? (
            <p className="text-muted-foreground">
              No responses yet. Share the link to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {plan.responses.map((r) => (
                <div key={r.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{r.guestName}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.selectedDates.map((d) => format(parseISO(d), "MMM d")).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {r.selectedDates.length} date{r.selectedDates.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
