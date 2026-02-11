"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarGrid } from "@/components/calendar-grid";
import { ComparisonCalendar, getPersonColor } from "@/components/comparison-calendar";
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
  const [selectedPerson, setSelectedPerson] = useState<ResponseData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());

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

  const rangeStart = parseISO(plan.startDate);
  const rangeEnd = parseISO(plan.endDate);

  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Build heatmap data
  const heatmapData = allDays.map((day) => {
    const names: string[] = [];
    for (const r of plan.responses) {
      if (r.selectedDates.some((d) => isSameDay(parseISO(d), day))) {
        names.push(r.guestName);
      }
    }
    return { date: day, count: names.length, names };
  });

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  // Build selected person's dates for individual calendar view
  const personDates = selectedPerson
    ? selectedPerson.selectedDates.map((d) => parseISO(d))
    : [];

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/plan/${plan.slug}` : "";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">{plan.name}</h1>
          {plan.description && (
            <p className="text-muted-foreground mt-1">{plan.description}</p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/plan/${plan.slug}`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Share Page</Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Heatmap</CardTitle>
          <CardDescription>
            {plan.responses.length} response{plan.responses.length !== 1 ? "s" : ""} ·
            Red = most available · Green = least available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarGrid
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            heatmapData={heatmapData}
            maxCount={maxCount}
          />
        </CardContent>
      </Card>

      {/* Individual Person View */}
      {selectedPerson && !compareMode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedPerson.guestName}&apos;s Availability</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPerson(null)}>
                ✕ Close
              </Button>
            </div>
            <CardDescription>
              {selectedPerson.selectedDates.length} date{selectedPerson.selectedDates.length !== 1 ? "s" : ""} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarGrid
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              selectedDates={personDates}
              selectable={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {compareMode && selectedPeople.size >= 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Schedule Comparison</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCompareMode(false);
                  setSelectedPeople(new Set());
                }}
              >
                ✕ Close
              </Button>
            </div>
            <CardDescription>
              Comparing {selectedPeople.size} people · Each colored dot represents one person&apos;s availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonCalendar
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              people={Array.from(selectedPeople).map((id) => {
                const response = plan.responses.find((r) => r.id === id)!;
                return {
                  id: response.id,
                  name: response.guestName,
                  dates: response.selectedDates.map((d) => parseISO(d)),
                  color: "", // color will be determined by index in ComparisonCalendar
                };
              })}
            />
          </CardContent>
        </Card>
      )}

      {/* Responses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Responses</CardTitle>
            {plan.responses.length >= 2 && (
              <div className="flex gap-2">
                {compareMode && selectedPeople.size >= 2 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Comparison view is already shown above when compareMode is true and selectedPeople.size >= 2
                      // This button just provides a visual confirmation
                    }}
                  >
                    Compare ({selectedPeople.size})
                  </Button>
                )}
                <Button
                  variant={compareMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (!compareMode) {
                      setSelectedPeople(new Set());
                      setSelectedPerson(null);
                    }
                  }}
                >
                  {compareMode ? "Cancel" : "Compare"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {plan.responses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-3">
                No responses yet. Share the link to get started!
              </p>
              <Link href={`/plan/${plan.slug}`}>
                <Button variant="outline">Go to Share Page</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.responses.map((r) => {
                const isChecked = selectedPeople.has(r.id);
                
                return (
                  <div
                    key={r.id}
                    className={`
                      w-full flex items-start gap-3 border rounded-lg p-4 transition-colors
                      ${compareMode
                        ? isChecked
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                        : selectedPerson?.id === r.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }
                    `}
                  >
                    {compareMode && (
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          const newSelected = new Set(selectedPeople);
                          if (e.currentTarget.checked) {
                            newSelected.add(r.id);
                          } else {
                            newSelected.delete(r.id);
                          }
                          setSelectedPeople(newSelected);
                        }}
                        className="mt-1"
                      />
                    )}
                    <button
                      onClick={() => {
                        if (compareMode) {
                          const newSelected = new Set(selectedPeople);
                          if (isChecked) {
                            newSelected.delete(r.id);
                          } else {
                            newSelected.add(r.id);
                          }
                          setSelectedPeople(newSelected);
                        } else {
                          setSelectedPerson(selectedPerson?.id === r.id ? null : r);
                        }
                      }}
                      className="flex-1 flex items-start justify-between text-left"
                    >
                      <div>
                        <p className="font-medium">{r.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.selectedDates.map((d) => format(parseISO(d), "MMM d")).join(", ")}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {r.selectedDates.length} date{r.selectedDates.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
