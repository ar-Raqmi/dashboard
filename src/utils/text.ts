/** Up to two initials for an avatar; iterates code points so an emoji is never split into a lone surrogate. */
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => Array.from(w)[0].toUpperCase()).join('') || '·';
