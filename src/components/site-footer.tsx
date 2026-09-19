import { COPYRIGHT_HOLDER, LICENSE_URL } from '#/lib/site'

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-[1600px] border-t px-4 py-6 text-sm sm:px-6">
      © {new Date().getFullYear()} {COPYRIGHT_HOLDER}. Released under the{' '}
      <a
        href={LICENSE_URL}
        target="_blank"
        rel="noreferrer"
        className="decoration-border hover:text-foreground underline underline-offset-2 hover:decoration-current"
      >
        MIT License
      </a>
      .
    </footer>
  )
}
