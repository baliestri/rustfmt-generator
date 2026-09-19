import { SITE_URL } from '#/lib/site'
import {
  CATEGORIES,
  OPTIONS,
  isDefault,
  requiresNightly,
  type OptionDef,
  type OptionValue,
} from './options'
import type { Overrides } from './schema'

export type ExportMode = 'changed' | 'all'

function tomlValue(value: OptionValue): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(', ')}]`
  return String(value)
}

/** Options every export skips unless the user set them explicitly. */
function omitFromFullExport(def: OptionDef) {
  // required_version defaults to the running rustfmt, version is deprecated,
  // and nightly-only options make stable rustfmt warn about an unknown key.
  return (
    def.name === 'required_version' ||
    def.deprecated !== undefined ||
    def.nightlyOnly === true
  )
}

export function serialize(overrides: Overrides, mode: ExportMode): string {
  const lines = [`# Generated with ${SITE_URL}`]
  let nightly = false

  for (const category of CATEGORIES) {
    const entries: string[] = []
    for (const def of OPTIONS) {
      if (def.category !== category) continue
      const override = overrides[def.name]
      const isSet = override !== undefined && !isDefault(def, override)
      if (!isSet && (mode === 'changed' || omitFromFullExport(def))) continue

      const value = isSet ? override : def.default
      const line = `${def.name} = ${tomlValue(value)}`
      if (requiresNightly(def, value)) {
        nightly = true
        entries.push(`${line} # nightly`)
      } else {
        entries.push(line)
      }
    }
    if (entries.length > 0) lines.push('', `# ${category}`, ...entries)
  }

  if (nightly) {
    lines.splice(
      1,
      0,
      '# Options marked "nightly" need the nightly toolchain: cargo +nightly fmt',
    )
  }
  return lines.join('\n') + '\n'
}
