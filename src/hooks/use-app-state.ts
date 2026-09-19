import { useEffect, useReducer } from 'react'
import {
  OPTION_BY_NAME,
  isDefault,
  type OptionValue,
} from '#/lib/rustfmt/options'
import type { Overrides } from '#/lib/rustfmt/schema'
import type { ExportMode } from '#/lib/rustfmt/serialize'
import {
  loadState,
  saveState,
  type Filters,
  type PersistedState,
} from '#/lib/storage'

export type Action =
  | { type: 'set'; name: string; value: OptionValue }
  | { type: 'reset'; name: string }
  | { type: 'resetAll' }
  | { type: 'import'; overrides: Overrides; replace: boolean }
  | { type: 'select'; name: string }
  | { type: 'filters'; filters: Partial<Filters> }
  | { type: 'exportMode'; mode: ExportMode }

export function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'set': {
      const def = OPTION_BY_NAME.get(action.name)
      if (!def) return state
      const overrides = { ...state.overrides }
      if (isDefault(def, action.value)) delete overrides[action.name]
      else overrides[action.name] = action.value
      return { ...state, overrides, selected: action.name }
    }
    case 'reset': {
      const overrides = { ...state.overrides }
      delete overrides[action.name]
      return { ...state, overrides }
    }
    case 'resetAll':
      return { ...state, overrides: {} }
    case 'import':
      return {
        ...state,
        overrides: action.replace
          ? action.overrides
          : { ...state.overrides, ...action.overrides },
      }
    case 'select':
      return { ...state, selected: action.name }
    case 'filters':
      return { ...state, filters: { ...state.filters, ...action.filters } }
    case 'exportMode':
      return { ...state, exportMode: action.mode }
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // The state is a few hundred bytes, so writing on every change is cheap and
  // nothing is lost if the tab closes right after an edit.
  useEffect(() => saveState(state), [state])

  return [state, dispatch] as const
}
