"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SELECTION_COUNT, PERSONALITY_WORD_POOL } from "@/lib/personality";
import { WordPicker } from "@/components/personality/word-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewPersonalityQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectionCount, setSelectionCount] = useState(DEFAULT_SELECTION_COUNT);
  const [selfWords, setSelfWords] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  async function handleCreate() {
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (selfWords.length !== selectionCount) {
      setError(`Choose exactly ${selectionCount} words for yourself before creating the quiz`);
      return;
    }

    setSaving(true);

    const res = await fetch("/api/personality-quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        instructions,
        selectionCount,
        selfWords,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create quiz");
      setSaving(false);
      return;
    }

    router.push(`/personality/${data.ownerToken}/results`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Personality Quiz</CardTitle>
          <CardDescription>
            Set up the quiz, choose your own words first, then share the public link with other people.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="How do people see Jamie?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A quick personality check-in with friends, coworkers, and family."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Responder instructions (optional)</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Leave blank to use the default instructions."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectionCount">How many words should people choose?</Label>
            <Input
              id="selectionCount"
              type="number"
              min={1}
              max={PERSONALITY_WORD_POOL.length - 1}
              value={selectionCount}
              onChange={(event) => {
                const next = Math.min(
                  Math.max(parseInt(event.target.value || String(DEFAULT_SELECTION_COUNT), 10) || DEFAULT_SELECTION_COUNT, 1),
                  PERSONALITY_WORD_POOL.length - 1
                );
                setSelectionCount(next);
                setSelfWords((prev) => prev.slice(0, next));
              }}
              className="max-w-32"
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Choose your own words first</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                This becomes the baseline for the results grid. You have to finish this before the share link is created.
              </p>
            </div>
            <WordPicker
              words={PERSONALITY_WORD_POOL}
              selectedWords={selfWords}
              selectionCount={selectionCount}
              onChange={setSelfWords}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Quiz"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/personality")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
