import { useEffect, useState } from 'react'
import type { OptionDef, OptionValue } from './rustfmt/options'

export interface OptionPreview {
  toolchain: 'stable' | 'nightly'
  input: string
  context?: Record<string, OptionValue>
  /** Formatted output keyed by `valueKey(value)`. */
  outputs: Record<string, string>
}

export interface PreviewData {
  stableVersion: string
  nightlyVersion: string
  options: Record<string, OptionPreview>
}

export const valueKey = (value: OptionValue) => JSON.stringify(value)

let cache: Promise<PreviewData> | null = null

function loadPreviews() {
  cache ??= import('#/data/previews.json').then((m) => m.default as PreviewData)
  return cache
}

export function usePreviews() {
  const [data, setData] = useState<PreviewData | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    loadPreviews().then(setData, () => setFailed(true))
  }, [])
  return { data, failed }
}

/**
 * The snapshot to show for `value`. Ints without a snapshot of their own fall
 * back to the closest value that has one.
 */
export function snapshotKeyFor(
  def: OptionDef,
  preview: OptionPreview,
  value: OptionValue,
): { key: string; exact: boolean } {
  const key = valueKey(value)
  if (key in preview.outputs) return { key, exact: true }
  if (def.kind === 'int') {
    const target = value as number
    const nearest = Object.keys(preview.outputs)
      .map(Number)
      .reduce((best, n) =>
        Math.abs(n - target) < Math.abs(best - target) ? n : best,
      )
    return { key: valueKey(nearest), exact: false }
  }
  return { key: valueKey(def.default), exact: false }
}

/** Short label for a snapshot key, as it would appear in rustfmt.toml. */
export function keyLabel(key: string) {
  const value = JSON.parse(key) as OptionValue
  if (Array.isArray(value)) return `[${value.map((v) => `"${v}"`).join(', ')}]`
  return typeof value === 'string' ? `"${value}"` : String(value)
}

/** "rustfmt 1.9.0-stable (48a229ceae 2026-09-01)" → "1.9.0-stable" */
export const shortVersion = (v: string) =>
  v.replace(/^rustfmt\s+/, '').replace(/\s*\(.*\)$/, '')
