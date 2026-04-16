'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

/**
 * Scan lines to find code fences that directly follow a Bad/Good heading
 * and append " bad" or " good" to the language tag so the custom renderer
 * can apply the right colour scheme.
 */
function tagCodeFences(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let pending: 'bad' | 'good' | null = null;

  for (const line of lines) {
    if (/^#{1,6}\s+.*(잘못된|Bad\s*Example)/i.test(line)) {
      pending = 'bad';
      out.push(line);
      continue;
    }
    if (/^#{1,6}\s+.*(올바른|Good\s*Example)/i.test(line)) {
      pending = 'good';
      out.push(line);
      continue;
    }
    // Reset on any other heading
    if (/^#{1,6}\s+/.test(line)) {
      pending = null;
    }
    // Tag the code fence opening
    if (pending && /^```(\w*)/.test(line)) {
      out.push(line.replace(/^```(\w*)/, `\`\`\`$1 ${pending}`));
      pending = null;
      continue;
    }
    out.push(line);
  }

  return out.join('\n');
}

/**
 * Custom <pre> renderer.
 * Wraps every code block in .code-wrap + .code-header + .code-dot
 * and applies .code-bad / .code-good for the appropriate colour scheme.
 */
function CustomPre({
  children,
  ...rest
}: React.HTMLAttributes<HTMLPreElement> & { node?: unknown }) {
  // The direct child of <pre> is always <code>
  const codeEl = React.Children.only(children) as React.ReactElement<{
    className?: string;
    children?: React.ReactNode;
  }>;

  const rawClass: string = codeEl?.props?.className ?? '';
  // rawClass is like "language-tsx bad" or "language-js good" or "language-tsx"
  const [langPart = '', ...flags] = rawClass.replace(/^language-/, '').split(/\s+/);
  const variant = flags.includes('bad') ? 'bad' : flags.includes('good') ? 'good' : '';

  // Strip the bad/good marker so rehype-highlight only sees the real language
  const cleanCode = React.cloneElement(codeEl, {
    className: langPart ? `language-${langPart}` : undefined,
  });

  const headerLabel =
    variant === 'bad'
      ? 'Bad Example'
      : variant === 'good'
      ? 'Good Example'
      : langPart || 'Code';

  // Drop the internal `node` prop that react-markdown injects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { node: _node, ...preProps } = rest as any;

  return (
    <div className={`code-wrap${variant ? ` code-${variant}` : ''}`}>
      <div className="code-header">
        <span className="code-dot" />
        <span>{headerLabel}</span>
        {variant && langPart && <span className="code-lang">{langPart}</span>}
      </div>
      <pre {...preProps}>{cleanCode}</pre>
    </div>
  );
}

const components: Components = {
  pre: CustomPre as Components['pre'],
};

export default function ArticleContent({ content }: { content: string }) {
  return (
    <div className="article-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {tagCodeFences(content)}
      </ReactMarkdown>
    </div>
  );
}
