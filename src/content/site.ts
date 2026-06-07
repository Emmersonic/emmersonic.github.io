export const site = {
  name: 'Taylor Emmerson',
  title: 'Taylor Emmerson: Product Designer',
  description: 'Product designer from Toronto, currently working at Homebase.',
  email: 'tayloremmerson@me.com',
  hero: 'Hiya!',
  // Hero statement (no trailing period, matching the live site).
  intro:
    "I'm Taylor, a product designer and systems thinker — currently making at Homebase in Toronto",
}

export type Site = typeof site

/** An inline run of text, optionally bolded (for the mixed-weight career copy). */
export interface TextRun {
  text: string
  bold?: boolean
}

/**
 * The About card copy — three paragraphs. The first reads as the serif lead;
 * bold runs match the emphasised phrases on the live site.
 */
export const career: TextRun[][] = [
  [
    { text: 'My career journey so far has been a balance between ' },
    { text: 'building and scaling design systems', bold: true },
    { text: ' and ' },
    { text: 'shipping product work', bold: true },
    { text: '.' },
  ],
  [
    {
      text: 'No matter the focus, I approach problems with a system thinking mindset, allowing me focus on impactful opportunities to leverage and simply existing experiences, or set up new ones for scale, with the ultimate goal of shipping quality products for users.',
    },
  ],
  [
    { text: 'As a senior contributor, I have experience ' },
    { text: 'shipping zero-to-one products', bold: true },
    { text: ', ' },
    { text: 'leading design visions', bold: true },
    { text: ', and being a collaborative team-member who ' },
    { text: 'fosters learning and development', bold: true },
    { text: ' in myself and others.' },
  ],
]
