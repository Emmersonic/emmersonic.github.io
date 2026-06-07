interface PageShellProps {
  children: React.ReactNode
}

/**
 * The outermost page wrapper: the warm paper canvas (#f7f4f1). The decorative
 * gradient blobs live inside the Hero band, not here. `overflow-x-clip` guards
 * against any bleed introducing horizontal scroll.
 */
export function PageShell({ children }: PageShellProps) {
  return <div className="min-h-screen overflow-x-clip bg-paper-1 text-ink">{children}</div>
}
