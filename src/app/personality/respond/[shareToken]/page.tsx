"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { WordPicker } from "@/components/personality/word-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PublicQuiz {
  title: string;
  description: string | null;
  instructions: string;
  selectionCount: number;
  creatorName: string | null;
  wordPool: string[];
  existingResponse: {
    responseToken: string;
    selectedWords: string[];
  } | null;
}

export default function PersonalityRespondPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;
  const storageKey = useMemo(() => `etc-personality-response:${shareToken}`, [shareToken]);

  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [responseToken, setResponseToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      const savedData = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      const parsed = savedData ? JSON.parse(savedData) : null;
      const token = typeof parsed?.responseToken === "string" ? parsed.responseToken : "";
      const query = token ? `?responseToken=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/personality/respond/${shareToken}${query}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Quiz not found");
        setLoading(false);
        return;
      }

      setQuiz(data);

      const initialWords = data.existingResponse?.selectedWords || (Array.isArray(parsed?.selectedWords) ? parsed.selectedWords : []);
      setSelectedWords(initialWords);
      setResponseToken(data.existingResponse?.responseToken || token || null);
      setLoading(false);
    }

    loadQuiz();
  }, [shareToken, storageKey]);

  async function handleSubmit() {
    if (!quiz) return;
    setError("");
    setSaved(false);

    if (selectedWords.length !== quiz.selectionCount) {
      setError(`Choose exactly ${quiz.selectionCount} words`);
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/personality/respond/${shareToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedWords,
        responseToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to save your response");
      setSaving(false);
      return;
    }

    setResponseToken(data.responseToken);
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ responseToken: data.responseToken, selectedWords: data.selectedWords })
    );
    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{error || "Quiz not found."}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.description || `Choose the ${quiz.selectionCount} words that best describe this person.`}
          </CardDescription>
          <div className="space-y-2 text-sm text-muted-foreground">
            {quiz.creatorName ? <p>About: {quiz.creatorName}</p> : null}
            <p>{quiz.instructions}</p>
            <p>Your response is saved only on this device, so you can come back and edit it later from the same browser.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <WordPicker
            words={quiz.wordPool}
            selectedWords={selectedWords}
            selectionCount={quiz.selectionCount}
            onChange={setSelectedWords}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-primary">Saved. You can revisit this link on this device to edit your response.</p>
          ) : null}

          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : responseToken ? "Update Response" : "Submit Response"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
