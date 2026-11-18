import { Check, Copy } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-4 rounded-lg border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900 text-xs text-slate-400">
        <span className="font-mono">{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const regex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={keyCounter++}
          className="px-1.5 py-0.5 mx-0.5 text-[0.85em] bg-slate-100 border border-slate-200 rounded text-slate-800 font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={keyCounter++} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2];
        const safeHref = /^https?:\/\//i.test(href) ? href : undefined;
        if (safeHref) {
          tokens.push(
            <a
              key={keyCounter++}
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              {label}
            </a>
          );
        } else {
          tokens.push(<span key={keyCounter++}>{label}</span>);
        }
      } else {
        tokens.push(token);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const cleaned = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|p|center|align|span|a|img|picture|source|details|summary|table|thead|tbody|tr|th|td|h[1-6]|ul|ol|li|strong|em|b|i|blockquote)[^>]*>/gi, (tag) => {
      if (/^<\/(p|div|h[1-6]|tr|li)>/i.test(tag)) return '\n';
      return '';
    });

  const lines = cleaned.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(<CodeBlock key={blockKey++} lang={lang} code={codeLines.join('\n')} />);
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/#+$/, '').trim();
      if (level === 1) {
        blocks.push(
          <h2 key={blockKey++} className="text-lg font-bold text-slate-900 mt-6 mb-2 pb-1.5 border-b border-slate-200 first:mt-0">
            {renderInline(text)}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3 key={blockKey++} className="text-base font-semibold text-slate-900 mt-5 mb-2">
            {renderInline(text)}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={blockKey++} className="text-sm font-semibold text-slate-800 mt-4 mb-1.5">
            {renderInline(text)}
          </h4>
        );
      }
      i++;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={blockKey++} className="my-3 pl-5 list-disc space-y-1.5 text-sm text-slate-700 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={blockKey++} className="my-3 pl-5 list-decimal space-y-1.5 text-sm text-slate-700 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={blockKey++}
          className="my-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed"
        >
          {renderInline(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }

    if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      blocks.push(<hr key={blockKey++} className="my-5 border-slate-200" />);
      i++;
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('>')
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    const paragraphText = paraLines.join(' ').trim();
    if (paragraphText) {
      blocks.push(
        <p key={blockKey++} className="my-2.5 text-sm text-slate-700 leading-relaxed">
          {renderInline(paragraphText)}
        </p>
      );
    }
  }

  return (
    <div className="max-w-none break-words">
      {blocks.map((block, idx) => (
        <Fragment key={idx}>{block}</Fragment>
      ))}
    </div>
  );
}
