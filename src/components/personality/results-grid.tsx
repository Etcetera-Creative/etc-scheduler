import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultWord {
  word: string;
  selfSelected: boolean;
  otherCount: number;
}

interface ResultsGridProps {
  both: ResultWord[];
  selfOnly: ResultWord[];
  othersOnly: ResultWord[];
  nobody: ResultWord[];
}

function WordList({ words, showCount = false }: { words: ResultWord[]; showCount?: boolean }) {
  if (words.length === 0) {
    return <p className="text-sm text-muted-foreground">None yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {words.map((word) => (
        <div
          key={word.word}
          className="rounded-full border bg-background px-3 py-2 text-sm"
        >
          {word.word}
          {showCount ? (
            <span className="ml-2 text-xs text-muted-foreground">{word.otherCount}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ResultsGrid({ both, selfOnly, othersOnly, nobody }: ResultsGridProps) {
  const sections = [
    {
      key: "both",
      title: "You + others chose",
      description: "Strong overlap between how you see yourself and how others see you.",
      words: both,
      showCount: true,
    },
    {
      key: "selfOnly",
      title: "Only you chose",
      description: "Traits you see in yourself that others have not picked yet.",
      words: selfOnly,
      showCount: false,
    },
    {
      key: "othersOnly",
      title: "Only others chose",
      description: "Traits others see in you that you did not choose yourself.",
      words: othersOnly,
      showCount: true,
    },
    {
      key: "nobody",
      title: "Nobody chose",
      description: "Words that have not been selected by you or any responder.",
      words: nobody,
      showCount: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent>
            <WordList words={section.words} showCount={section.showCount} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
