import { ExternalLink, RotateCcw, Search } from 'lucide-react'
import { useMemo, type Dispatch } from 'react'
import { OptionControl } from '#/components/option-control'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import type { Action } from '#/hooks/use-app-state'
import {
  CATEGORIES,
  OPTIONS,
  docsUrl,
  requiresNightly,
  type OptionDef,
} from '#/lib/rustfmt/options'
import { effectiveValue, type ConfigIssue } from '#/lib/rustfmt/schema'
import type { PersistedState } from '#/lib/storage'
import { cn } from '#/lib/utils'

interface Props {
  state: PersistedState
  issues: ConfigIssue[]
  dispatch: Dispatch<Action>
  onSelect: (name: string) => void
}

export function OptionList({ state, issues, dispatch, onSelect }: Props) {
  const { filters, overrides, selected } = state
  const changedCount = Object.keys(overrides).length

  const groups = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    const visible = OPTIONS.filter((def) => {
      if (filters.category !== 'all' && def.category !== filters.category)
        return false
      if (filters.modifiedOnly && !(def.name in overrides)) return false
      if (filters.hideNightly && !def.stable) return false
      if (!q) return true
      return (
        def.name.includes(q.replace(/\s+/g, '_')) ||
        def.description.toLowerCase().includes(q)
      )
    })
    return CATEGORIES.map((category) => ({
      category,
      options: visible.filter((d) => d.category === category),
    })).filter((g) => g.options.length > 0)
  }, [filters, overrides])

  const setFilters = (f: Partial<PersistedState['filters']>) =>
    dispatch({ type: 'filters', filters: f })

  return (
    <div>
      <div className="bg-background/95 sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="Search options"
            placeholder="Search options"
            className="h-8 pl-8"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(v) =>
            setFilters({
              category: (v ?? 'all') as PersistedState['filters']['category'],
            })
          }
        >
          <SelectTrigger aria-label="Category" className="h-8 min-w-44">
            <SelectValue>
              {(v: string) => (v === 'all' ? 'All categories' : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={filters.modifiedOnly}
            onCheckedChange={(v) => setFilters({ modifiedOnly: v })}
          />
          Changed only
          <span className="text-muted-foreground tabular-nums">
            ({changedCount})
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={filters.hideNightly}
            onCheckedChange={(v) => setFilters({ hideNightly: v })}
          />
          Stable only
        </label>
      </div>

      {groups.length === 0 ? (
        <EmptyList
          modifiedOnly={filters.modifiedOnly}
          onClear={() =>
            setFilters({
              query: '',
              category: 'all',
              modifiedOnly: false,
              hideNightly: false,
            })
          }
        />
      ) : (
        groups.map((group) => (
          <section key={group.category} aria-labelledby={slug(group.category)}>
            <h2
              id={slug(group.category)}
              className="font-display text-muted-foreground mt-8 mb-1 text-2xl font-semibold tracking-wide"
            >
              {group.category}
            </h2>
            <ul className="divide-y">
              {group.options.map((def) => (
                <OptionRow
                  key={def.name}
                  def={def}
                  state={state}
                  issues={issues.filter((i) => i.option === def.name)}
                  selected={selected === def.name}
                  dispatch={dispatch}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function OptionRow({
  def,
  state,
  issues,
  selected,
  dispatch,
  onSelect,
}: {
  def: OptionDef
  state: PersistedState
  issues: ConfigIssue[]
  selected: boolean
  dispatch: Dispatch<Action>
  onSelect: (name: string) => void
}) {
  const value = effectiveValue(def, state.overrides)
  const changed = def.name in state.overrides
  const nightly = requiresNightly(def, value)

  return (
    <li
      aria-current={selected ? 'true' : undefined}
      onFocusCapture={() => !selected && onSelect(def.name)}
      onClick={() => !selected && onSelect(def.name)}
      className={cn(
        'relative -mx-3 grid cursor-default grid-cols-1 gap-x-6 gap-y-2 rounded-md px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]',
        selected && 'bg-accent/60',
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="bg-primary absolute top-2 bottom-2 left-0 w-0.5 rounded-full"
        />
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              'font-mono text-[0.8125rem] font-medium break-all',
              changed && 'text-primary',
            )}
          >
            {def.name}
          </span>
          {changed && <span className="sr-only">(changed)</span>}
          {!def.stable && (
            <span className="bg-nightly-soft text-nightly rounded-sm px-1.5 py-px text-[0.6875rem]">
              nightly
            </span>
          )}
          {def.stable && nightly && (
            <span className="bg-nightly-soft text-nightly rounded-sm px-1.5 py-px text-[0.6875rem]">
              this value needs nightly
            </span>
          )}
          {def.deprecated && (
            <span className="bg-muted text-muted-foreground rounded-sm px-1.5 py-px text-[0.6875rem]">
              deprecated
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 max-w-prose text-sm">
          {def.description}
          {def.deprecated && ` ${def.deprecated}`}{' '}
          <a
            href={docsUrl(def.name)}
            target="_blank"
            rel="noreferrer"
            className="decoration-border hover:text-foreground inline-flex items-center gap-0.5 whitespace-nowrap underline underline-offset-2 hover:decoration-current"
          >
            Docs
            <ExternalLink aria-hidden className="size-3" />
            <span className="sr-only">for {def.name} (opens in a new tab)</span>
          </a>
        </p>
        {issues.map((issue) => (
          <p key={issue.message} className="text-destructive mt-1 text-sm">
            {issue.message}
          </p>
        ))}
      </div>
      <div className="flex items-center gap-1 sm:justify-end">
        <OptionControl
          def={def}
          value={value}
          onChange={(v) => dispatch({ type: 'set', name: def.name, value: v })}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Reset ${def.name} to default`}
          title="Reset to default"
          className={cn(!changed && 'invisible')}
          onClick={() => dispatch({ type: 'reset', name: def.name })}
        >
          <RotateCcw />
        </Button>
      </div>
    </li>
  )
}

function EmptyList({
  modifiedOnly,
  onClear,
}: {
  modifiedOnly: boolean
  onClear: () => void
}) {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">
        {modifiedOnly
          ? 'No options changed yet. Turn off "Changed only" to see all of them.'
          : 'No options match these filters.'}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}

const slug = (s: string) => 'cat-' + s.toLowerCase().replace(/[^a-z]+/g, '-')
