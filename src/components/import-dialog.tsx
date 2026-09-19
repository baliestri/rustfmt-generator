import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { parseRustfmtToml, type ImportResult } from '#/lib/rustfmt/parse'
import type { Overrides } from '#/lib/rustfmt/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (overrides: Overrides, replace: boolean) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: Props) {
  const [text, setText] = useState('')
  const [replace, setReplace] = useState(true)
  const [result, setResult] = useState<ImportResult | null>(null)

  const close = () => {
    onOpenChange(false)
    setResult(null)
    setText('')
  }

  const apply = (overrides: Overrides) => {
    onImport(overrides, replace)
    close()
  }

  const check = () => {
    const parsed = parseRustfmtToml(text)
    if (parsed.errors.length === 0) apply(parsed.overrides)
    else setResult(parsed)
  }

  const validCount = result ? Object.keys(result.overrides).length : 0

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a rustfmt.toml</DialogTitle>
          <DialogDescription>
            Paste the contents of an existing file or choose one from your
            computer.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          aria-label="rustfmt.toml contents"
          className="h-48 font-mono text-xs"
          placeholder={'max_width = 120\nimports_granularity = "Crate"'}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm">
            <span className="sr-only">Choose a file</span>
            <input
              type="file"
              accept=".toml,text/plain"
              className="file:bg-background hover:file:bg-muted text-sm file:mr-3 file:rounded-md file:border file:px-2.5 file:py-1 file:text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setText(await file.text())
                setResult(null)
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={replace} onCheckedChange={setReplace} />
            Replace current options
          </label>
        </div>

        {result && (
          <div
            role="alert"
            className="border-destructive/40 max-h-40 overflow-y-auto rounded-md border p-3 text-sm"
          >
            <p className="text-destructive font-medium">
              {result.errors.length}{' '}
              {result.errors.length === 1 ? 'problem' : 'problems'} found
            </p>
            <ul className="mt-1 space-y-0.5">
              {result.errors.map((err, i) => (
                <li key={i}>
                  {err.key && (
                    <code className="font-mono text-xs">{err.key}</code>
                  )}
                  {err.key && ': '}
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          {result && validCount > 0 ? (
            <Button onClick={() => apply(result.overrides)}>
              Import {validCount} valid{' '}
              {validCount === 1 ? 'option' : 'options'}
            </Button>
          ) : (
            <Button onClick={check} disabled={!text.trim() || !!result}>
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
