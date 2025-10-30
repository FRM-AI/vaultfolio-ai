import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAnalysisPanelProps {
  title: string;
  content: string;
}

const markdownComponents = {
  table: (props: any) => (
    <div className="overflow-x-auto my-6 rounded-lg border-2 border-primary/20 shadow-[var(--shadow-card)] bg-card">
      <table className="min-w-full divide-y divide-border border-collapse" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gradient-to-r from-primary/10 to-accent/10" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-border bg-background" {...props} />,
  th: (props: any) => (
    <th 
      className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-primary/30" 
      {...props} 
    />
  ),
  td: (props: any) => (
    <td
      className="px-4 py-3 text-sm text-foreground whitespace-normal break-words"
      {...props}
    />
  ),
  tr: (props: any) => <tr className="hover:bg-muted/30 transition-colors even:bg-muted/10" {...props} />,
  p: (props: any) => <p className="my-3 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="my-4 ml-6 list-disc space-y-2" {...props} />,
  ol: (props: any) => <ol className="my-4 ml-6 list-decimal space-y-2" {...props} />,
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  h1: (props: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
  strong: (props: any) => <strong className="font-bold text-foreground" {...props} />,
  em: (props: any) => <em className="italic text-foreground/90" {...props} />,
  code: (props: any) => (
    <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props} />
  ),
  pre: (props: any) => (
    <pre className="my-4 p-4 rounded-lg bg-muted overflow-x-auto" {...props} />
  ),
};

export function AIAnalysisPanel({ title, content }: AIAnalysisPanelProps) {
  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
