"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  tool: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  BUILT: "bg-blue-100 text-blue-800",
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("EXISTING_TOOL");
  const [tool, setTool] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadSuggestions() {
    const res = await fetch("/api/suggestions");
    if (res.ok) {
      setSuggestions(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      loadSuggestions();
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, tool: tool || null }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit");
      setSubmitting(false);
      return;
    }

    setTitle("");
    setDescription("");
    setCategory("EXISTING_TOOL");
    setTool("");
    setSuccess(true);
    setSubmitting(false);
    loadSuggestions();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Feature Suggestions</h1>
        <p className="text-muted-foreground">
          Have an idea for a new tool or improvement? Let us know!
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Submit a Suggestion</CardTitle>
          <CardDescription>
            Tell us what you&apos;d like to see added or improved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of your idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="EXISTING_TOOL">Feature for existing tool</option>
                <option value="NEW_TOOL">New tool suggestion</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool">
                {category === "EXISTING_TOOL" ? "Which tool?" : "Proposed tool name"}
              </Label>
              <Input
                id="tool"
                placeholder={
                  category === "EXISTING_TOOL"
                    ? "e.g. Scheduler, URL Shortener"
                    : "e.g. Expense Tracker"
                }
                value={tool}
                onChange={(e) => setTool(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your idea in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">Suggestion submitted! Thanks for the feedback.</p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Suggestions</h2>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t submitted any suggestions yet.</p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg break-words">{s.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>
                          {s.category === "EXISTING_TOOL"
                            ? "Existing tool"
                            : "New tool"}
                        </span>
                        {s.tool && (
                          <>
                            <span>·</span>
                            <span>{s.tool}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[s.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-hidden">
                    {s.description}
                  </p>
                  {s.adminNotes && (
                    <div className="mt-3 p-3 bg-muted rounded-md overflow-hidden">
                      <p className="text-xs font-medium mb-1">Admin response:</p>
                      <p className="text-sm break-words">{s.adminNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
