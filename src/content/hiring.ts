export interface HiringLink {
  name: string
  href: string
}

export const hiring = {
  body: "If you have an opportunity that would be a good fit, I'd love to hear about it! Though please consider taking the time to check out some other fine folks from these sites.",
  links: [
    { name: 'blackswho.design', href: 'https://blackswho.design' },
    { name: 'queerdesign.club', href: 'https://queerdesign.club' },
    { name: 'womenwho.design', href: 'https://womenwho.design/' },
  ] as HiringLink[],
}

export const footer = { text: 'Still here? Get in touch,', email: 'tayloremmerson@me.com' }
