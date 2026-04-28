"use client";

import { cn } from "@/lib/utils";

interface WordPickerProps {
  words: string[];
  selectedWords: string[];
  selectionCount: number;
  onChange: (next: string[]) => void;
}

export function WordPicker({ words, selectedWords, selectionCount, onChange }: WordPickerProps) {
  function toggleWord(word: string) {
    const isSelected = selectedWords.includes(word);

    if (isSelected) {
      onChange(selectedWords.filter((selectedWord) => selectedWord !== word));
      return;
    }

    if (selectedWords.length >= selectionCount) return;
    onChange([...selectedWords, word]);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Pick exactly <span className="font-medium text-foreground">{selectionCount}</span> words.
        <span className="ml-2">{selectedWords.length}/{selectionCount} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {words.map((word) => {
          const isSelected = selectedWords.includes(word);
          const atLimit = selectedWords.length >= selectionCount && !isSelected;

          return (
            <button
              key={word}
              type="button"
              onClick={() => toggleWord(word)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent",
                atLimit && "cursor-not-allowed opacity-50"
              )}
              disabled={atLimit}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
