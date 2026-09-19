import { useState, type Dispatch } from 'react'
import { CodeView } from '#/components/code-view'
import { Button } from '#/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { Action } from '#/hooks/use-app-state'
import {
  keyLabel,
  shortVersion,
  snapshotKeyFor,
  valueKey,
  type PreviewData,
} from '#/lib/previews'
import type { OptionDef, OptionValue } from '#/lib/rustfmt/options'
import { effectiveValue, type Overrides } from '#/lib/rustfmt/schema'
import { cn } from '#/lib/utils'

interface Props {
  def: OptionDef
  overrides: Overrides
  previews: { data: PreviewData | null; failed: boolean }
  dispatch: Dispatch<Action>
}

export function PreviewPanel({ def, overrides, previews, dispatch }: Props) {
  const [pinned, setPinned] = useState<{ option: string; key: string } | null>(
    null,
  )
  const [view, setView] = useState<'diff' | 'input'>('diff')

  const heading = (
    <div>
      <h2 className="font-mono text-base font-medium break-all">{def.name}</h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        {def.description}
      </p>
    </div>
  )

  if (def.noPreview) {
    return (
      <div className="space-y-4">
        {heading}
        <Notice>
          This option changes how rustfmt runs, not how the code looks, so there
          is nothing to preview.
        </Notice>
      </div>
    )
  }
  if (previews.failed) {
    return (
      <div className="space-y-4">
        {heading}
        <Notice>Previews didn't load. Reload the page to try again.</Notice>
      </div>
    )
  }
  const preview = previews.data?.options[def.name]
  if (!previews.data || !preview) {
    return (
      <div className="space-y-4">
        {heading}
        <div className="bg-code h-64 animate-pulse rounded-md border" />
      </div>
    )
  }

  const value = effectiveValue(def, overrides)
  const current = snapshotKeyFor(def, preview, value)
  const defaultKey = valueKey(def.default)
  const keys = Object.keys(preview.outputs)

  let shownKey =
    pinned?.option === def.name && pinned.key in preview.outputs
      ? pinned.key
      : current.key
  const autoPicked = shownKey === defaultKey && !pinned && keys.length > 1
  if (autoPicked) shownKey = keys.find((k) => k !== defaultKey)!

  const shownValue = JSON.parse(shownKey) as OptionValue
  const before = preview.outputs[defaultKey]
  const after = preview.outputs[shownKey]
  const guide =
    def.name === 'max_width'
      ? (shownValue as number)
      : ((preview.context?.max_width as number | undefined) ?? 100)
  const version =
    preview.toolchain === 'nightly'
      ? previews.data.nightlyVersion
      : previews.data.stableVersion

  return (
    <div className="space-y-4">
      {heading}

      <div>
        <p id="preview-values" className="mb-2 text-sm font-medium">
          Preview a value
        </p>
        <div
          role="group"
          aria-labelledby="preview-values"
          className="flex flex-wrap gap-1.5"
        >
          {keys.map((key) => {
            const active = key === shownKey
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setPinned({ option: def.name, key })}
                className={cn(
                  'focus-visible:ring-ring/50 rounded-md border px-2 py-1 font-mono text-xs transition-colors outline-none focus-visible:ring-3',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                {keyLabel(key)}
                {key === defaultKey && (
                  <span
                    className={cn(
                      'ml-1.5 font-sans',
                      active ? 'opacity-80' : 'text-muted-foreground',
                    )}
                  >
                    default
                  </span>
                )}
                {key === current.key && current.exact && key !== defaultKey && (
                  <span
                    className={cn(
                      'ml-1.5 font-sans',
                      active ? 'opacity-80' : 'text-primary',
                    )}
                  >
                    yours
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          aria-label="Preview view"
          variant="outline"
          size="sm"
          spacing={0}
          value={[view]}
          onValueChange={(v) => {
            if (v.length > 0) setView(v[v.length - 1] as 'diff' | 'input')
          }}
        >
          <ToggleGroupItem value="diff" className="px-3 text-xs">
            Changes from default
          </ToggleGroupItem>
          <ToggleGroupItem value="input" className="px-3 text-xs">
            Unformatted input
          </ToggleGroupItem>
        </ToggleGroup>
        {valueKey(value) !== shownKey && (
          <Button
            size="sm"
            onClick={() =>
              dispatch({ type: 'set', name: def.name, value: shownValue })
            }
          >
            Use {keyLabel(shownKey)}
          </Button>
        )}
      </div>

      {view === 'diff' ? (
        <CodeView
          before={before}
          after={after}
          guide={guide}
          tabSize={def.name === 'tab_spaces' ? (shownValue as number) : 4}
        />
      ) : (
        <CodeView before={preview.input} after={preview.input} guide={guide} />
      )}

      <ul className="text-muted-foreground space-y-1 text-sm">
        {view === 'diff' && before === after && (
          <li>This value formats the sample the same way as the default.</li>
        )}
        {autoPicked && (
          <li>
            Your config uses the default, so the preview shows{' '}
            <code className="text-foreground font-mono">
              {keyLabel(shownKey)}
            </code>{' '}
            to make the difference visible.
          </li>
        )}
        {!current.exact && !pinned && def.kind === 'int' && (
          <li>
            There's no snapshot for {String(value)}, so this shows the closest
            value, {keyLabel(current.key)}.
          </li>
        )}
        {preview.context && (
          <li>
            Formatted with{' '}
            {Object.entries(preview.context).map(([k, v], i) => (
              <span key={k}>
                {i > 0 && ', '}
                <code className="text-foreground font-mono">
                  {k} = {keyLabel(valueKey(v))}
                </code>
              </span>
            ))}
            , which this option needs to have an effect.
          </li>
        )}
        <li>Formatted by rustfmt {shortVersion(version)}.</li>
      </ul>
    </div>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-sm">
      {children}
    </p>
  )
}
