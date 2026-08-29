export interface DesignResource {
  name: string
  href: string
  desc: string
}

export const designResources: DesignResource[] = [
  {
    name: 'designsystemdocspec.org',
    href: 'https://designsystemdocspec.org/',
    desc: 'Community-driven spec for what good design system component docs should actually contain — anatomy, props, usage, a11y. Useful north star when writing your own.',
  },
  {
    name: 'figma-console-mcp docs',
    href: 'https://docs.figma-console-mcp.southleft.com/',
    desc: 'Docs for the Figma Console MCP — lets AI assistants write and inspect Figma files directly from the terminal. Genuinely useful for design-to-code workflows.',
  },
  {
    name: 'Draftboard',
    href: 'https://github.com/hrescak/Draftboard',
    desc: 'Figma plugin by Matej Hrescak for exploring and stress-testing component libraries. Good for catching edge cases in a design system before they hit production.',
  },
]
