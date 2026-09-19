import { useEffect, useState } from 'react'
import type { HighlighterCore, ThemedToken } from 'shiki/core'

export type Lang = 'rust' | 'toml'

let highlighter: Promise<HighlighterCore> | null = null

/** Loads shiki with only the two grammars and two themes this site needs. */
function getHighlighter() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
      await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
      ])
    return createHighlighterCore({
      themes: [
        import('shiki/themes/vitesse-light.mjs'),
        import('shiki/themes/vitesse-dark.mjs'),
      ],
      langs: [import('shiki/langs/rust.mjs'), import('shiki/langs/toml.mjs')],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighter
}

export type TokenLines = ThemedToken[][]

/** Per-line tokens for `code`, or null until the highlighter has loaded. */
export function useTokens(code: string, lang: Lang): TokenLines | null {
  const [result, setResult] = useState<{
    code: string
    lang: Lang
    lines: TokenLines
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((h) => {
        if (cancelled) return
        const { tokens } = h.codeToTokens(code, {
          lang,
          themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
        })
        setResult({ code, lang, lines: tokens })
      })
      .catch(() => {
        // Highlighting is cosmetic; plain text stays on screen.
      })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return result && result.code === code && result.lang === lang
    ? result.lines
    : null
}

/** Inline style for a token that carries both light and dark colors. */
export function tokenStyle(token: ThemedToken) {
  return token.htmlStyle as React.CSSProperties | undefined
}
