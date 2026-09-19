import { useState } from 'react'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type {
  IntOption,
  OptionDef,
  OptionValue,
  StringListOption,
} from '#/lib/rustfmt/options'

interface Props {
  def: OptionDef
  value: OptionValue
  onChange: (value: OptionValue) => void
}

export function OptionControl({ def, value, onChange }: Props) {
  const label = def.name
  switch (def.kind) {
    case 'bool':
      return (
        <Switch
          aria-label={label}
          checked={value as boolean}
          onCheckedChange={(checked) => onChange(checked)}
        />
      )
    case 'enum': {
      const compact = def.values.length <= 3 && def.values.join('').length <= 22
      if (compact) {
        return (
          <ToggleGroup
            aria-label={label}
            variant="outline"
            size="sm"
            spacing={0}
            value={[value as string]}
            onValueChange={(next) => {
              if (next.length > 0) onChange(next[next.length - 1] as string)
            }}
          >
            {def.values.map((v) => (
              <ToggleGroupItem
                key={v}
                value={v}
                className="px-2.5 font-mono text-xs"
              >
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )
      }
      return (
        <Select
          value={value as string}
          onValueChange={(next) => {
            if (typeof next === 'string') onChange(next)
          }}
        >
          <SelectTrigger
            aria-label={label}
            size="sm"
            className="min-w-40 font-mono text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {def.values.map((v) => (
              <SelectItem key={v} value={v} className="font-mono text-xs">
                {v}
                {def.unstableValues?.includes(v) && (
                  <span className="text-nightly ml-auto pl-3 font-sans">
                    nightly
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case 'int':
      return <IntInput def={def} value={value as number} onChange={onChange} />
    case 'string':
      return (
        <Input
          aria-label={label}
          className="h-7 w-44 font-mono text-xs"
          value={value as string}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'stringList':
      return (
        <ListInput def={def} value={value as string[]} onChange={onChange} />
      )
  }
}

function IntInput({
  def,
  value,
  onChange,
}: {
  def: IntOption
  value: number
  onChange: (v: number) => void
}) {
  // Keep a draft so the field can be empty or mid-edit without resetting.
  const [draft, setDraft] = useState(String(value))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    // The value changed from outside (reset, import): show it.
    setSeen(value)
    if (Number(draft) !== value) setDraft(String(value))
  }
  const parsed = Number(draft)
  const valid =
    draft.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= def.min &&
    (def.max === undefined || parsed <= def.max)

  return (
    <Input
      aria-label={def.name}
      aria-invalid={!valid}
      type="number"
      inputMode="numeric"
      min={def.min}
      max={def.max}
      className="h-7 w-24 text-right font-mono text-xs tabular-nums"
      value={draft}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        const n = Number(next)
        if (next.trim() !== '' && Number.isInteger(n) && n >= def.min) {
          onChange(n)
        }
      }}
      onBlur={() => {
        if (!valid) setDraft(String(value))
      }}
    />
  )
}

function ListInput({
  def,
  value,
  onChange,
}: {
  def: StringListOption
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState(value.join(', '))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    setDraft(value.join(', '))
  }
  const commit = () => {
    const items = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    onChange(items)
  }
  return (
    <Input
      aria-label={`${def.name}, comma separated`}
      className="h-7 w-56 font-mono text-xs"
      value={draft}
      placeholder={def.placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}
