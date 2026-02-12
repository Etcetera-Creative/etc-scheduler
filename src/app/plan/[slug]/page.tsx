"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarGrid } from "@/components/calendar-grid";
import { parseISO, isSameDay } from "date-fns";

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  creatorName: string | null;
}

export default function PlanGuestPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [guestName, setGuestName] = useState("");
  const [comment, setComment] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/plans/${slug}`);
      if (res.ok) {
        setPlan(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  function toggleDate(date: Date) {
    setSelectedDates((prev) => {
      const exists = prev.find((d) => isSameDay(d, date));
      if (exists) return prev.filter((d) => !isSameDay(d, date));
      return [...prev, date];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDates.length === 0) {
      setError("Please select at least one date");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/plans/${slug}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName,
        selectedDates: selectedDates.map((d) => d.toISOString()),
        comment: comment.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

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

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-2">
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-semibold">You&apos;re in!</p>
            <p className="text-muted-foreground">
              Your availability for <strong>{plan.name}</strong> has been submitted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          {plan.creatorName && (
            <CardDescription className="text-sm">
              Invited by: {plan.creatorName}
            </CardDescription>
          )}
          {plan.description && (
            <CardDescription>{plan.description}</CardDescription>
          )}
          <CardDescription>
            Select the dates you&apos;re available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="John Doe"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Any notes or preferences..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Your Available Dates</Label>
              <CalendarGrid
                rangeStart={parseISO(plan.startDate)}
                rangeEnd={parseISO(plan.endDate)}
                selectedDates={selectedDates}
                onToggleDate={toggleDate}
                selectable
              />
              <p className="text-xs text-muted-foreground">
                {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Availability"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
