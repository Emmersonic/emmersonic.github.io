export interface Trait {
  emoji: string
  label: string
  body: string
}

export const traits: Trait[] = [
  {
    emoji: '💭',
    label: 'Process-driven',
    body: "Craft isn't just the end result — it's a reflection of how we work. I set up structure, document decisions, and simplify workflows to reduce unnecessary process.",
  },
  {
    emoji: '🕵️',
    label: 'Technical',
    body: 'The age-old question “Should designers code?”. Yes! I write front-end code and collaborate with engineers on technical decisions and tradeoffs.',
  },
  {
    emoji: '👨‍💻',
    label: 'A prototyper',
    body: "If a picture's worth 1,000 words, a prototype's worth 10,000. I use the right tools for the fidelity we need — Origami, clickable Figma prototypes, or code.",
  },
  {
    emoji: '📝',
    label: 'The PM-hybrid',
    body: 'I often write briefs and set strategic direction, making sure we define problems clearly and measure results accurately.',
  },
]
