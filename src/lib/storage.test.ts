import { afterEach, describe, expect, it, vi } from 'vitest'
import { reducer } from '#/hooks/use-app-state'
import { DEFAULT_STATE, STORAGE_KEY, loadState, saveState } from './storage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('storage', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('round-trips saved state', () => {
    const state = { ...DEFAULT_STATE, overrides: { max_width: 80 } }
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('survives corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('drops unknown options and invalid values but keeps the rest', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        overrides: { max_width: 80, removed_option: 1, hard_tabs: 'nope' },
        exportMode: 'weird',
        filters: { query: 'x' },
        selected: 'removed_option',
      }),
    )
    const state = loadState()
    expect(state.overrides).toEqual({ max_width: 80 })
    expect(state.exportMode).toBe('changed')
    expect(state.selected).toBe(DEFAULT_STATE.selected)
  })

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadState()).toEqual(DEFAULT_STATE)
    expect(() => saveState(DEFAULT_STATE)).not.toThrow()
  })
})

describe('reducer', () => {
  it('removes an override when set back to the default', () => {
    let state = reducer(DEFAULT_STATE, {
      type: 'set',
      name: 'max_width',
      value: 80,
    })
    expect(state.overrides).toEqual({ max_width: 80 })
    state = reducer(state, { type: 'set', name: 'max_width', value: 100 })
    expect(state.overrides).toEqual({})
  })

  it('merges or replaces on import', () => {
    const start = { ...DEFAULT_STATE, overrides: { hard_tabs: true } }
    const merged = reducer(start, {
      type: 'import',
      overrides: { max_width: 80 },
      replace: false,
    })
    expect(merged.overrides).toEqual({ hard_tabs: true, max_width: 80 })
    const replaced = reducer(start, {
      type: 'import',
      overrides: { max_width: 80 },
      replace: true,
    })
    expect(replaced.overrides).toEqual({ max_width: 80 })
  })
})
