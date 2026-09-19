import { parse as parseToml, TomlError } from 'smol-toml'
import { OPTION_BY_NAME, isDefault } from './options'
import { valueSchema, type Overrides } from './schema'

export interface ImportError {
  key?: string
  message: string
}

export interface ImportResult {
  overrides: Overrides
  errors: ImportError[]
}

/** Parse a rustfmt.toml. Valid keys are kept; invalid ones are reported. */
export function parseRustfmtToml(text: string): ImportResult {
  let doc: Record<string, unknown>
  try {
    doc = parseToml(text)
  } catch (err) {
    const message =
      err instanceof TomlError
        ? `Line ${err.line}: ${err.message.split('\n')[0]}`
        : 'This file is not valid TOML.'
    return { overrides: {}, errors: [{ message }] }
  }

  const overrides: Overrides = {}
  const errors: ImportError[] = []

  for (const [key, raw] of Object.entries(doc)) {
    const def = OPTION_BY_NAME.get(key)
    if (!def) {
      errors.push({ key, message: 'Not a rustfmt option.' })
      continue
    }
    // TOML integers parse as number or bigint; rustfmt option values fit a number.
    const value = typeof raw === 'bigint' ? Number(raw) : raw
    const result = valueSchema(def).safeParse(value)
    if (!result.success) {
      errors.push({ key, message: describeExpected(key) })
      continue
    }
    if (!isDefault(def, result.data)) overrides[key] = result.data
  }

  return { overrides, errors }
}

function describeExpected(key: string): string {
  const def = OPTION_BY_NAME.get(key)!
  switch (def.kind) {
    case 'bool':
      return 'Expected true or false.'
    case 'int':
      return `Expected a whole number of at least ${def.min}.`
    case 'enum':
      return `Expected one of ${def.values.map((v) => `"${v}"`).join(', ')}.`
    case 'string':
      return 'Expected a string.'
    case 'stringList':
      return 'Expected a list of strings.'
  }
}
