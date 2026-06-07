export interface Role {
  title: string
  period: string
}

export interface Company {
  company: string
  href: string
  period: string
  location: string
  roles: Role[]
}

export interface Education {
  school: string
  href: string
  period: string
  degree: string
  location: string
}

export const work: Company[] = [
  {
    company: 'homebase',
    href: 'https://joinhomebase.com/',
    period: '2026 — Present',
    location: 'Toronto, Canada',
    roles: [],
  },
  {
    company: 'meta',
    href: 'https://design.facebook.com/',
    period: '2016 — 2026',
    location: 'New York, USA',
    roles: [
      { title: 'Recruiting Products', period: "'25 — '26" },
      { title: 'Design Tools', period: "'22 — '25" },
      { title: 'Facebook Groups', period: "'21 — '22" },
      { title: 'Business Design Systems', period: "'18 — '21" },
      { title: 'Business Suite', period: "'16 — '18" },
    ],
  },
  {
    company: 'format',
    href: 'https://format.com',
    period: '2015 — 2016',
    location: 'Toronto, Canada',
    roles: [],
  },
]

export const education: Education = {
  school: 'York University & Sheridan College',
  href: 'https://ysdn.info/',
  period: '2012 - 2016',
  degree: 'B.Des (Hons)',
  location: 'Toronto, Canada',
}
