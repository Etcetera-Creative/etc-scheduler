"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ResultsGrid } from "@/components/personality/results-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultWord {
  word: string;
  selfSelected: boolean;
  otherCount: number;
}

interface ResultsPayload {
  quiz: {
    ownerToken: string;
    shareToken: string;
    title: string;
    description: string | null;
    instructions: string;
    selectionCount: number;
    selfWords: string[];
  };
  responseCount: number;
  buckets: {
    both: ResultWord[];
    selfOnly: ResultWord[];
    othersOnly: ResultWord[];
    nobody: ResultWord[];
  };
}

export default function PersonalityResultsPage() {
  const params = useParams<{ ownerToken: string }>();
  const ownerToken = params.ownerToken;
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await fetch(`/api/personality-quizzes/${ownerToken}/results`, { cache: "no-store" });
      const payload = await res.json();

      if (!mounted) return;

      if (!res.ok) {
        setError(payload.error || "Failed to load results");
        setLoading(false);
        return;
      }

      setData(payload);
      setLoading(false);
    }

    load();
    const interval = window.setInterval(load, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [ownerToken]);

  function copyShareLink() {
    if (!data) return;
    navigator.clipboard.writeText(`${window.location.origin}/personality/respond/${data.quiz.shareToken}`);
  }

  function copyOwnerLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{error || "Quiz not found."}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{data.quiz.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {data.quiz.description || `${data.quiz.selectionCount} words selected per response.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyShareLink}>Copy Share Link</Button>
          <Button variant="outline" onClick={copyOwnerLink}>Copy Owner Link</Button>
          <Link href="/personality">
            <Button variant="outline">All Quizzes</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responses</CardTitle>
            <CardDescription>Live-updating responder count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.responseCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your self-selection</CardTitle>
            <CardDescription>The baseline words you chose when creating the quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.quiz.selfWords.map((word) => (
                <div key={word} className="rounded-full border bg-background px-3 py-2 text-sm">{word}</div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responder instructions</CardTitle>
            <CardDescription>What people see on the public response page</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.quiz.instructions}</p>
          </CardContent>
        </Card>
      </div>

      <ResultsGrid {...data.buckets} />
    </div>
  );
}
