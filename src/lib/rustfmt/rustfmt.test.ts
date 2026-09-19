import { parse } from 'smol-toml'
import { describe, expect, it } from 'vitest'
import previews from '#/data/previews.json'
import fixtureText from '../../../scripts/fixtures/default-config.toml?raw'
import { valueKey, type PreviewData } from '#/lib/previews'
import { OPTIONS, OPTION_BY_NAME, isDefault } from './options'
import { parseRustfmtToml } from './parse'
import { overridesSchema, validateConfig } from './schema'
import { serialize } from './serialize'

const fixture = parse(fixtureText)

describe('option schema', () => {
  it('covers every option in `rustfmt --print-config default`', () => {
    for (const [name, value] of Object.entries(fixture)) {
      const def = OPTION_BY_NAME.get(name)
      expect(def, name).toBeDefined()
      expect(isDefault(def!, value as never), name).toBe(true)
    }
  })

  it('only adds options missing from stable when they are nightly-only', () => {
    const extra = OPTIONS.filter((o) => !(o.name in fixture))
    expect(extra.every((o) => o.nightlyOnly)).toBe(true)
  })

  it('has unique names and enum defaults among their values', () => {
    expect(OPTION_BY_NAME.size).toBe(OPTIONS.length)
    for (const def of OPTIONS) {
      if (def.kind === 'enum') expect(def.values).toContain(def.default)
    }
  })
})

describe('serialize', () => {
  it('writes only changed options by default', () => {
    const toml = serialize({ max_width: 120, hard_tabs: true }, 'changed')
    expect(parse(toml)).toEqual({ max_width: 120, hard_tabs: true })
  })

  it('round-trips every kind of value through TOML and the schema', () => {
    const overrides = {
      max_width: 80,
      imports_granularity: 'Crate',
      wrap_comments: true,
      required_version: '>=1.9',
      skip_macro_invocations: ['*', 'say "hi"'],
    }
    const back = parse(serialize(overrides, 'changed'))
    expect(back).toEqual(overrides)
    expect(overridesSchema.safeParse(back).success).toBe(true)
  })

  it('marks options that need nightly', () => {
    const toml = serialize({ wrap_comments: true, max_width: 90 }, 'changed')
    expect(toml).toContain('wrap_comments = true # nightly')
    expect(toml).toContain('max_width = 90\n')
    expect(toml).toContain('cargo +nightly fmt')
  })

  it('writes a valid file with every option in "all" mode', () => {
    const doc = parse(serialize({}, 'all'))
    expect(overridesSchema.safeParse(doc).success).toBe(true)
    expect(doc).not.toHaveProperty('required_version')
    expect(doc).not.toHaveProperty('version')
    expect(doc).not.toHaveProperty('doc_comment_code_block_small_heuristics')
    expect(Object.keys(doc).length).toBe(OPTIONS.length - 3)
  })
})

describe('parseRustfmtToml', () => {
  it('keeps valid keys and reports the rest', () => {
    const { overrides, errors } = parseRustfmtToml(
      [
        'max_width = 120',
        'tab_spaces = 4', // default, dropped
        'brace_style = "Sideways"',
        'no_such_option = true',
        'hard_tabs = "yes"',
      ].join('\n'),
    )
    expect(overrides).toEqual({ max_width: 120 })
    expect(errors.map((e) => e.key)).toEqual([
      'brace_style',
      'no_such_option',
      'hard_tabs',
    ])
  })

  it('reports TOML syntax errors', () => {
    const { overrides, errors } = parseRustfmtToml('max_width = ')
    expect(overrides).toEqual({})
    expect(errors).toHaveLength(1)
  })
})

describe('validateConfig', () => {
  it('flags widths above max_width', () => {
    const issues = validateConfig({ max_width: 50, fn_call_width: 60 })
    expect(issues.map((i) => i.option)).toEqual(['fn_call_width'])
  })

  it('accepts the defaults', () => {
    expect(validateConfig({})).toEqual([])
  })
})

describe('preview snapshots', () => {
  const data = previews as PreviewData

  it('exist for every previewable option, including the default value', () => {
    for (const def of OPTIONS) {
      if (def.noPreview) continue
      const preview = data.options[def.name]
      expect(preview, def.name).toBeDefined()
      expect(preview.outputs[valueKey(def.default)], def.name).toBeTypeOf(
        'string',
      )
    }
  })

  it('show a difference for every option', () => {
    for (const [name, preview] of Object.entries(data.options)) {
      expect(
        new Set(Object.values(preview.outputs)).size,
        name,
      ).toBeGreaterThan(1)
    }
  })
})
