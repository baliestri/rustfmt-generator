import { diffLines } from 'diff'
import type { CSSProperties } from 'react'
import {
  tokenStyle,
  useTokens,
  type Lang,
  type TokenLines,
} from '#/lib/highlight'
import { cn } from '#/lib/utils'

type LineKind = 'same' | 'add' | 'del'

interface Line {
  kind: LineKind
  text: string
  /** Index into the tokens of the side this line came from. */
  index: number
}

function buildLines(before: string, after: string): Line[] {
  const lines: Line[] = []
  let oldIndex = 0
  let newIndex = 0
  for (const change of diffLines(before, after)) {
    const texts = change.value.replace(/\n$/, '').split('\n')
    for (const text of texts) {
      if (change.added) lines.push({ kind: 'add', text, index: newIndex++ })
      else if (change.removed)
        lines.push({ kind: 'del', text, index: oldIndex++ })
      else {
        lines.push({ kind: 'same', text, index: newIndex++ })
        oldIndex++
      }
    }
  }
  return lines
}

const GUTTER = 3 // characters reserved for the +/- marker

interface Props {
  before: string
  after: string
  lang?: Lang
  /** Column to draw the max_width guide at. */
  guide?: number
  tabSize?: number
  /** Show the column ruler along the top. */
  ruler?: boolean
  className?: string
}

/**
 * Monospace code with a column ruler along the top and a guide at max_width.
 * Shows a unified line diff when `before` and `after` differ.
 */
export function CodeView({
  before,
  after,
  lang = 'rust',
  guide,
  tabSize = 4,
  ruler = true,
  className,
}: Props) {
  const oldTokens = useTokens(before, lang)
  const newTokens = useTokens(after, lang)
  const diff = before !== after
  const lines = diff
    ? buildLines(before, after)
    : after
        .replace(/\n$/, '')
        .split('\n')
        .map((text, index): Line => ({ kind: 'same', text, index }))

  const longest = Math.max(...lines.map((l) => l.text.length), 0)
  // Leave room past the longest line so the ruler labels have space.
  const columns = Math.max(longest, guide ?? 0) + (ruler ? 8 : 1)

  return (
    <div
      className={cn(
        'bg-code overflow-x-auto rounded-md border font-mono text-[0.8125rem] leading-6',
        className,
      )}
      style={{ tabSize } as CSSProperties}
    >
      <div
        className="relative min-w-max pb-2"
        style={{ width: `calc(${GUTTER + columns}ch + 1rem)` }}
      >
        {ruler ? (
          <Ruler columns={columns} skip={guide} />
        ) : (
          <div className="h-2" />
        )}
        {guide !== undefined && (
          <div
            aria-hidden
            className="border-guide/70 pointer-events-none absolute top-0 bottom-0 border-l border-dashed"
            style={{ left: `${GUTTER + guide}ch` }}
          >
            <span className="text-guide absolute bottom-0 left-1 font-sans text-[0.625rem] leading-5 whitespace-nowrap">
              max_width {guide}
            </span>
          </div>
        )}
        <pre className="m-0">
          <code>
            {lines.map((line, i) => (
              <CodeLine
                key={i}
                line={line}
                tokens={line.kind === 'del' ? oldTokens : newTokens}
              />
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

function CodeLine({ line, tokens }: { line: Line; tokens: TokenLines | null }) {
  const lineTokens = tokens?.[line.index]
  return (
    <div
      className={cn(
        'flex min-h-6',
        line.kind === 'add' && 'bg-diff-add',
        line.kind === 'del' && 'bg-diff-del',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'w-[3ch] shrink-0 text-center select-none',
          line.kind === 'add' && 'text-diff-add-mark',
          line.kind === 'del' && 'text-diff-del-mark',
        )}
      >
        {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ''}
      </span>
      {line.kind !== 'same' && (
        <span className="sr-only">
          {line.kind === 'add' ? 'Added: ' : 'Removed: '}
        </span>
      )}
      <span className="whitespace-pre">
        {lineTokens && tokensMatch(lineTokens, line.text)
          ? lineTokens.map((t, j) => (
              <span key={j} className="shiki-token" style={tokenStyle(t)}>
                {t.content}
              </span>
            ))
          : line.text || ' '}
      </span>
    </div>
  )
}

const tokensMatch = (tokens: TokenLines[number], text: string) =>
  tokens.map((t) => t.content).join('') === text

function Ruler({ columns, skip }: { columns: number; skip?: number }) {
  const labels = []
  for (let c = 10; c <= columns; c += 10) if (c !== skip) labels.push(c)
  return (
    <div
      aria-hidden
      className="relative mb-1 h-5 border-b select-none"
      style={{
        marginLeft: `${GUTTER}ch`,
        backgroundImage: [
          'repeating-linear-gradient(to right, var(--ruler) 0 1px, transparent 1px 10ch)',
          'repeating-linear-gradient(to right, var(--ruler) 0 1px, transparent 1px 1ch)',
        ].join(','),
        backgroundSize: '100% 7px, 100% 3px',
        backgroundPosition: 'left bottom, left bottom',
        backgroundRepeat: 'no-repeat',
        opacity: 0.9,
      }}
    >
      {labels.map((c) => (
        // Position in the code font's ch units, then shrink only the label.
        <span key={c} className="absolute top-0" style={{ left: `${c}ch` }}>
          <span className="text-ruler block pl-0.5 text-[0.625rem] leading-3">
            {c}
          </span>
        </span>
      ))}
    </div>
  )
}
