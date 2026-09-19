import { Check, Copy, Download, RotateCcw, Upload } from 'lucide-react'
import { useState, type Dispatch } from 'react'
import { toast } from 'sonner'
import { CodeView } from '#/components/code-view'
import { ImportDialog } from '#/components/import-dialog'
import { Button } from '#/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { Action } from '#/hooks/use-app-state'
import { OPTION_BY_NAME, requiresNightly } from '#/lib/rustfmt/options'
import type { Overrides } from '#/lib/rustfmt/schema'
import { serialize, type ExportMode } from '#/lib/rustfmt/serialize'

interface Props {
  overrides: Overrides
  exportMode: ExportMode
  dispatch: Dispatch<Action>
}

export function OutputPanel({ overrides, exportMode, dispatch }: Props) {
  const [copied, setCopied] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const toml = serialize(overrides, exportMode)
  const changed = Object.entries(overrides)
  const nightlyCount = changed.filter(([name, value]) =>
    requiresNightly(OPTION_BY_NAME.get(name)!, value!),
  ).length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Copied rustfmt.toml to the clipboard')
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.")
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([toml], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'rustfmt.toml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    const previous = overrides
    dispatch({ type: 'resetAll' })
    toast('Reset all options to their defaults', {
      action: {
        label: 'Undo',
        onClick: () =>
          dispatch({ type: 'import', overrides: previous, replace: true }),
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          aria-label="Options to include"
          variant="outline"
          size="sm"
          spacing={0}
          value={[exportMode]}
          onValueChange={(v) => {
            if (v.length > 0)
              dispatch({
                type: 'exportMode',
                mode: v[v.length - 1] as ExportMode,
              })
          }}
        >
          <ToggleGroupItem value="changed" className="px-3 text-xs">
            Changed options
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="px-3 text-xs">
            All options
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload />
            Import
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {changed.length === 0
          ? 'Every option is at its default.'
          : `${changed.length} ${changed.length === 1 ? 'option' : 'options'} changed`}
        {nightlyCount > 0 &&
          `, ${nightlyCount} of them only on nightly (run cargo +nightly fmt)`}
        {changed.length > 0 && '.'}
      </p>

      <CodeView before={toml} after={toml} lang="toml" ruler={false} />

      {changed.length === 0 && exportMode === 'changed' && (
        <p className="text-muted-foreground text-sm">
          Change an option on the left and it shows up here.
        </p>
      )}

      {changed.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={resetAll}
        >
          <RotateCcw />
          Reset all options
        </Button>
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(imported, replace) => {
          dispatch({ type: 'import', overrides: imported, replace })
          const n = Object.keys(imported).length
          toast.success(`Imported ${n} ${n === 1 ? 'option' : 'options'}`)
        }}
      />
    </div>
  )
}
