import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely (clsx for conditionals, twMerge to dedupe conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
