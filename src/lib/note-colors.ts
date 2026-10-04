/** Stored as hex in the Note.color column. Existing notes may hold older palette values; those still render. */
export const NOTE_COLORS = [
  { value: '#A7C080', label: 'Green' },
  { value: '#83C092', label: 'Aqua' },
  { value: '#7FBBB3', label: 'Blue' },
  { value: '#D699B6', label: 'Purple' },
  { value: '#E67E80', label: 'Red' },
  { value: '#E69875', label: 'Orange' },
  { value: '#DBBC7F', label: 'Yellow' },
] as const

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0].value
