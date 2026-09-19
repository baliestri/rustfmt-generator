import { COPYRIGHT_HOLDER } from '#/lib/site'

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-[1600px] border-t px-4 py-6 text-sm sm:px-6">
      © {new Date().getFullYear()} {COPYRIGHT_HOLDER}
    </footer>
  )
}
