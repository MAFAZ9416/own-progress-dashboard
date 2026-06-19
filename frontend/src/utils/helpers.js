/**
 * cn — className utility (lightweight clsx alternative)
 * Filters falsy values and joins class names.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 *
 * Usage:
 *   cn('base-class', isActive && 'active-class', error && 'error-class')
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ')

/**
 * capitalize — capitalizes the first letter of a string
 * @param {string} str
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

/**
 * clamp — constrains a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * slugify — converts a string to a URL-safe slug
 * @param {string} str
 */
export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
