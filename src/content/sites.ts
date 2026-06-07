export interface SiteLink {
  name: string
  href: string
  desc: string
}

export const sites: SiteLink[] = [
  {
    name: 'futurefonts.xyz',
    href: 'https://futurefonts.xyz',
    desc: "I've spent way more money here than I'm proud to admit",
  },
  {
    name: 'typewolf.com',
    href: 'https://typewolf.com',
    desc: 'Nice typefaces & sites',
  },
  {
    name: 'codesandbox.io',
    href: 'https://codesandbox.io',
    desc: 'Great place to get started learning React without the environment setup',
  },
]
