import ReactMarkdown from "react-markdown";

interface MarkdownDescriptionProps {
  content: string;
  className?: string;
}

export function MarkdownDescription({
  content,
  className = "",
}: MarkdownDescriptionProps) {
  return (
    <div
      className={`prose prose-sm max-w-none bg-muted/50 rounded-lg p-4 border-l-4 border-primary/20 ${className}`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
