import { z } from 'zod/mini'
import {
  OPTION_BY_NAME,
  OPTIONS,
  type OptionDef,
  type OptionValue,
} from './options'

export type Overrides = Partial<Record<string, OptionValue>>

export function valueSchema(def: OptionDef): z.ZodMiniType<OptionValue> {
  switch (def.kind) {
    case 'bool':
      return z.boolean()
    case 'int':
      return def.max === undefined
        ? z.int().check(z.gte(def.min))
        : z.int().check(z.gte(def.min), z.lte(def.max))
    case 'enum':
      return z.enum(def.values as [string, ...string[]])
    case 'string':
      return z.string()
    case 'stringList':
      return z.array(z.string())
  }
}

export const overridesSchema = z.strictObject(
  Object.fromEntries(
    OPTIONS.map((def) => [def.name, z.optional(valueSchema(def))]),
  ),
)

export function effectiveValue(def: OptionDef, overrides: Overrides) {
  return overrides[def.name] ?? def.default
}

export interface ConfigIssue {
  option: string
  message: string
}

/** Cross-option rules that rustfmt enforces when it loads the config. */
export function validateConfig(overrides: Overrides): ConfigIssue[] {
  const issues: ConfigIssue[] = []
  const get = (name: string) =>
    effectiveValue(OPTION_BY_NAME.get(name)!, overrides)
  const maxWidth = get('max_width') as number

  for (const def of OPTIONS) {
    if (def.kind === 'int' && def.boundedByMaxWidth) {
      const v = get(def.name) as number
      if (def.name in overrides && v > maxWidth) {
        issues.push({
          option: def.name,
          message: `Exceeds max_width (${maxWidth}), so rustfmt will cap it at ${maxWidth}.`,
        })
      }
    }
  }

  if (
    (get('blank_lines_lower_bound') as number) >
    (get('blank_lines_upper_bound') as number)
  ) {
    issues.push({
      option: 'blank_lines_lower_bound',
      message:
        'Is greater than blank_lines_upper_bound, which rustfmt does not expect.',
    })
  }

  if ('version' in overrides && 'style_edition' in overrides) {
    issues.push({
      option: 'version',
      message: 'style_edition takes precedence, so rustfmt ignores version.',
    })
  }

  return issues
}
