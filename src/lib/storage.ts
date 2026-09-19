import { z } from 'zod/mini'
import { CATEGORIES, OPTION_BY_NAME, isDefault } from './rustfmt/options'
import { valueSchema, type Overrides } from './rustfmt/schema'

export const STORAGE_KEY = 'rustfmt-generator:v1'
export const THEME_KEY = 'rustfmt-generator:theme'

const filtersSchema = z.object({
  query: z.catch(z.string(), ''),
  category: z.catch(z.enum(['all', ...CATEGORIES]), 'all'),
  modifiedOnly: z.catch(z.boolean(), false),
  hideNightly: z.catch(z.boolean(), false),
})

export type Filters = z.infer<typeof filtersSchema>

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: 'all',
  modifiedOnly: false,
  hideNightly: false,
}

export interface PersistedState {
  overrides: Overrides
  exportMode: 'changed' | 'all'
  filters: Filters
  selected: string
}

export const DEFAULT_STATE: PersistedState = {
  overrides: {},
  exportMode: 'changed',
  filters: DEFAULT_FILTERS,
  selected: 'max_width',
}

const stateSchema = z.object({
  overrides: z.catch(z.record(z.string(), z.unknown()), {}),
  exportMode: z.catch(z.enum(['changed', 'all']), 'changed'),
  filters: z.catch(filtersSchema, DEFAULT_FILTERS),
  selected: z.catch(
    z.string().check(z.refine((s) => OPTION_BY_NAME.has(s))),
    DEFAULT_STATE.selected,
  ),
})

/** Keep only overrides that are still valid options with valid values. */
function cleanOverrides(raw: Record<string, unknown>): Overrides {
  const out: Overrides = {}
  for (const [key, value] of Object.entries(raw)) {
    const def = OPTION_BY_NAME.get(key)
    if (!def) continue
    const parsed = valueSchema(def).safeParse(value)
    if (parsed.success && !isDefault(def, parsed.data)) out[key] = parsed.data
  }
  return out
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = stateSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return DEFAULT_STATE
    return { ...parsed.data, overrides: cleanOverrides(parsed.data.overrides) }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be full or blocked (private mode); the app keeps working.
  }
}
