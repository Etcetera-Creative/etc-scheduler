"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizSummary {
  id: string;
  ownerToken: string;
  shareToken: string;
  title: string;
  description: string | null;
  selectionCount: number;
  createdAt: string;
  _count: { responses: number };
}

export default function PersonalityPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/personality-quizzes");
      if (res.ok) {
        setQuizzes(await res.json());
      }
      setLoading(false);
    }

    load();
  }, []);

  async function handleDelete(ownerToken: string, title: string) {
    if (!confirm(`Delete \"${title}\"? This will remove all responses.`)) return;

    const res = await fetch(`/api/personality-quizzes/${ownerToken}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setQuizzes((prev) => prev.filter((quiz) => quiz.ownerToken !== ownerToken));
    }
  }

  function handleCopyShareLink(shareToken: string) {
    navigator.clipboard.writeText(`${window.location.origin}/personality/respond/${shareToken}`);
  }

  function handleCopyOwnerLink(ownerToken: string) {
    navigator.clipboard.writeText(`${window.location.origin}/personality/${ownerToken}/results`);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Etc Personality Quiz</h1>
          <p className="mt-1 text-muted-foreground">Create quizzes, share them, and compare self-perception with outside feedback.</p>
        </div>
        <Link href="/personality/new">
          <Button>New Quiz</Button>
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="mb-4 text-muted-foreground">You haven&apos;t created any personality quizzes yet.</p>
            <Link href="/personality/new">
              <Button>Create Your First Quiz</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.description || `Pick exactly ${quiz.selectionCount} words from the full list.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {quiz._count.responses} response{quiz._count.responses !== 1 ? "s" : ""} · Created {format(new Date(quiz.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyShareLink(quiz.shareToken)}>
                      Copy Share Link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyOwnerLink(quiz.ownerToken)}>
                      Copy Owner Link
                    </Button>
                    <Link href={`/personality/${quiz.ownerToken}/results`}>
                      <Button size="sm">View Results</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(quiz.ownerToken, quiz.title)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
