// Formats every preview sample with the real rustfmt and writes the results to
// src/data/previews.json. Run with `pnpm previews`.
//
// Toolchains default to the ones the committed snapshots were made with and can
// be overridden with RUSTFMT_STABLE / RUSTFMT_NIGHTLY.

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { OPTIONS, type OptionDef } from '../src/lib/rustfmt/options.ts'
import { PREVIEWS } from './preview-samples.ts'

type Value = boolean | number | string | string[]

const STABLE = process.env.RUSTFMT_STABLE ?? '1.98.1'
const NIGHTLY = process.env.RUSTFMT_NIGHTLY ?? 'nightly'
const OUT = new URL('../src/data/previews.json', import.meta.url)

const workDir = mkdtempSync(join(tmpdir(), 'rustfmt-previews-'))
const configPath = join(workDir, 'rustfmt.toml')

function tomlValue(value: Value): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(', ')}]`
  return String(value)
}

function rustfmt(toolchain: string, args: string[], input = '') {
  const result = spawnSync('rustfmt', [`+${toolchain}`, ...args], {
    cwd: workDir,
    input,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return result
}

function format(
  toolchain: string,
  input: string,
  config: Record<string, Value>,
) {
  const toml = Object.entries(config)
    .map(([k, v]) => `${k} = ${tomlValue(v)}`)
    .join('\n')
  writeFileSync(configPath, toml + '\n')
  const result = rustfmt(toolchain, ['--config-path', configPath], input)
  if (result.status !== 0) {
    throw new Error(
      `rustfmt +${toolchain} failed with\n${toml}\n\n${result.stderr}`,
    )
  }
  const warnings = result.stderr
    .split('\n')
    .filter((l) => l.trim() && !l.includes('`version` option'))
  if (warnings.length > 0) {
    throw new Error(
      `rustfmt +${toolchain} warned with\n${toml}\n\n${warnings.join('\n')}`,
    )
  }
  // Snapshots use \n regardless of the platform they were generated on.
  return result.stdout.replace(/\r\n/g, '\n')
}

function valuesFor(def: OptionDef, spec: (typeof PREVIEWS)[string]): Value[] {
  switch (def.kind) {
    case 'bool':
      return [false, true]
    case 'enum':
      return [...def.values]
    case 'int':
      return [...new Set([def.default, ...(spec.ints ?? [])])].sort(
        (a, b) => a - b,
      )
    case 'stringList':
      return [def.default, ...(spec.lists ?? [])]
    case 'string':
      return [def.default]
  }
}

function toolchainFor(def: OptionDef) {
  const needsNightly =
    !def.stable ||
    (def.kind === 'enum' && (def.unstableValues?.length ?? 0) > 0)
  return needsNightly ? NIGHTLY : STABLE
}

const version = (toolchain: string) =>
  rustfmt(toolchain, ['--version']).stdout.trim()

const output = {
  stableVersion: version(STABLE),
  nightlyVersion: version(NIGHTLY),
  options: {} as Record<
    string,
    {
      toolchain: 'stable' | 'nightly'
      input: string
      context?: Record<string, Value>
      outputs: Record<string, string>
    }
  >,
}

try {
  for (const def of OPTIONS) {
    if (def.noPreview) continue
    const spec = PREVIEWS[def.name]
    if (!spec) throw new Error(`No preview sample for ${def.name}`)

    const toolchain = toolchainFor(def)
    const outputs: Record<string, string> = {}
    for (const value of valuesFor(def, spec)) {
      outputs[JSON.stringify(value)] = format(toolchain, spec.sample, {
        ...spec.context,
        [def.name]: value,
      })
    }

    const distinct = new Set(Object.values(outputs)).size
    if (distinct < 2) console.warn(`warning: ${def.name} shows no change`)

    output.options[def.name] = {
      toolchain: toolchain === NIGHTLY ? 'nightly' : 'stable',
      input: spec.sample,
      ...(spec.context ? { context: spec.context } : {}),
      outputs,
    }
    console.log(
      `${def.name}: ${Object.keys(outputs).length} values, ${distinct} distinct`,
    )
  }
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n')
console.log(
  `\nWrote ${Object.keys(output.options).length} previews to src/data/previews.json`,
)
console.log(`${output.stableVersion} / ${output.nightlyVersion}`)
