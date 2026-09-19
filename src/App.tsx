import { Eye, FileCode } from 'lucide-react'
import { useMemo, useState, type Dispatch } from 'react'
import { OptionList } from '#/components/option-list'
import { OutputPanel } from '#/components/output-panel'
import { PreviewPanel } from '#/components/preview-panel'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { ThemeProvider } from '#/components/theme-provider'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import { Toaster } from '#/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { TooltipProvider } from '#/components/ui/tooltip'
import { useAppState, type Action } from '#/hooks/use-app-state'
import { usePreviews } from '#/lib/previews'
import { OPTION_BY_NAME } from '#/lib/rustfmt/options'
import { validateConfig } from '#/lib/rustfmt/schema'
import type { PersistedState } from '#/lib/storage'

type Panel = 'preview' | 'file'

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Generator />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  )
}

function Generator() {
  const [state, dispatch] = useAppState()
  const previews = usePreviews()
  const [panel, setPanel] = useState<Panel>('preview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const issues = useMemo(
    () => validateConfig(state.overrides),
    [state.overrides],
  )
  const changedCount = Object.keys(state.overrides).length

  const select = (name: string) => dispatch({ type: 'select', name })

  const openMobile = (p: Panel) => {
    setPanel(p)
    setMobileOpen(true)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader previews={previews.data} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-24 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:pb-12">
        <OptionList
          state={state}
          issues={issues}
          dispatch={dispatch}
          onSelect={select}
        />
        <aside aria-label="Preview and file" className="hidden lg:block">
          <div className="sticky top-0 max-h-svh overflow-y-auto py-3">
            <Workbench
              state={state}
              previews={previews}
              dispatch={dispatch}
              panel={panel}
              onPanelChange={setPanel}
              changedCount={changedCount}
            />
          </div>
        </aside>
      </main>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t px-4 py-3 backdrop-blur lg:hidden">
        <Button
          variant="outline"
          className="min-w-0 flex-1"
          onClick={() => openMobile('preview')}
        >
          <Eye />
          <span className="truncate">
            Preview <span className="font-mono">{state.selected}</span>
          </span>
        </Button>
        <Button className="flex-1" onClick={() => openMobile('file')}>
          <FileCode />
          rustfmt.toml ({changedCount})
        </Button>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="max-h-[90svh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl lg:hidden">
          <DialogTitle className="sr-only">
            {panel === 'preview' ? 'Preview' : 'rustfmt.toml'}
          </DialogTitle>
          <Workbench
            state={state}
            previews={previews}
            dispatch={dispatch}
            panel={panel}
            onPanelChange={setPanel}
            changedCount={changedCount}
          />
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  )
}

function Workbench({
  state,
  previews,
  dispatch,
  panel,
  onPanelChange,
  changedCount,
}: {
  state: PersistedState
  previews: ReturnType<typeof usePreviews>
  dispatch: Dispatch<Action>
  panel: Panel
  onPanelChange: (p: Panel) => void
  changedCount: number
}) {
  const def = OPTION_BY_NAME.get(state.selected)!
  return (
    <Tabs value={panel} onValueChange={(v) => onPanelChange(v as Panel)}>
      <TabsList className="mb-4">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="file">
          rustfmt.toml
          <span className="text-muted-foreground ml-1 tabular-nums">
            {changedCount}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <PreviewPanel
          def={def}
          overrides={state.overrides}
          previews={previews}
          dispatch={dispatch}
        />
      </TabsContent>
      <TabsContent value="file">
        <OutputPanel
          overrides={state.overrides}
          exportMode={state.exportMode}
          dispatch={dispatch}
        />
      </TabsContent>
    </Tabs>
  )
}
