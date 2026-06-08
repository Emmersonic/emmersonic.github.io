export interface Tool {
  name: string
  href: string
  desc: string
}

export const tools: Tool[] = [
  {
    name: 'subspace',
    href: 'https://www.subspace.build/',
    desc: 'An AI workspace that wrangles CLI/terminal windows, browser inspection, .md/code writing, and git all in one tool — handling many things in parallel',
  },
  {
    name: 'arc',
    href: 'https://arc.net',
    desc: 'Finally got my browser organized',
  },
  {
    name: 'heptabase',
    href: 'https://heptabase.com',
    desc: 'A visual note-taking and organizational tool for all your thoughts',
  },
]
