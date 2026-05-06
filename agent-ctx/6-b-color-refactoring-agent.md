# Task 6-b: Color Refactoring Agent

## Task
Replace hardcoded oklch() color values with semantic CSS variable-based Tailwind classes in NotesPage.tsx and SpiritualPage.tsx

## Files Updated
- `src/components/pages/NotesPage.tsx`
- `src/components/pages/SpiritualPage.tsx`

## Summary of Changes

### NotesPage.tsx
All hardcoded oklch values replaced:
- `bg-[oklch(0.72_0.19_142_/_0.15)]` → `bg-primary/15`
- `text-[oklch(0.72_0.19_142)]` → `text-primary` (all instances including hover states)
- `bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]` → `bg-primary text-primary-foreground hover:bg-primary/90` (3 button instances)
- `bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)]` → `bg-card border-border` (2 dialog instances)
- `text-[oklch(0.96_0.005_155)]` → `text-foreground`
- `text-[oklch(0.75_0.01_155)]` → `text-on-surface-variant` (6 label/button instances)
- `bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]` → `bg-input border-border` (4 input/textarea instances)
- `ring-offset-[oklch(0.17_0.008_155)]` → `ring-offset-card` (2 color picker instances)
- `text-[oklch(0.65_0.01_155)]` → `text-muted-foreground`
- `bg-[oklch(0.22_0.008_155)]` → `bg-muted` (search input + empty state)
- `border-[oklch(0.28_0.01_155)]` → `border-border` (note cards)
- `hover:bg-[oklch(0.72_0.19_142_/_0.1)]` → `hover:bg-primary/10`
- `text-[oklch(0.65_0.2_25)] hover:text-[oklch(0.7_0.2_25)] hover:bg-[oklch(0.65_0.2_25_/_0.1)]` → `text-destructive hover:text-destructive hover:bg-destructive/10`
- `text-[oklch(0.55_0.01_155)]` → `text-outline`

### SpiritualPage.tsx
All hardcoded oklch values replaced:
- `bg-[oklch(0.72_0.19_142_/_0.15)]` → `bg-primary/15`
- `text-[oklch(0.72_0.19_142)]` → `text-primary` (all instances)
- `bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)]` → `bg-card border-border` (2 card instances)
- `bg-[oklch(0.72_0.19_142_/_0.05)]` → `bg-primary/5` (decorative circle)
- `bg-[oklch(0.8_0.08_350_/_0.05)]` → `bg-secondary/5` (decorative circle)
- `bg-[oklch(0.72_0.19_142_/_0.3)]` → `bg-primary/30` (decorative dot)
- `bg-[oklch(0.8_0.08_350_/_0.3)]` → `bg-secondary/30` (decorative dot)
- `text-[oklch(0.75_0.01_155)] hover:text-primary hover:bg-[oklch(0.72_0.19_142_/_0.1)]` → `text-on-surface-variant hover:text-primary hover:bg-primary/10`
- `text-[oklch(0.75_0.01_155)] hover:text-secondary hover:bg-[oklch(0.8_0.08_350_/_0.1)]` → `text-on-surface-variant hover:text-secondary hover:bg-secondary/10`
- `bg-[oklch(0.22_0.008_155)]` → `bg-muted` (6 skeleton + hadith info bg)
- `text-[oklch(0.96_0.005_155)]` → `text-foreground`
- `text-[oklch(0.85_0.005_155)]` → `text-foreground`
- `text-[oklch(0.65_0.01_155)]` → `text-muted-foreground`
- `text-[oklch(0.8_0.08_350)]` → `text-secondary`
- `text-[oklch(0.8_0.12_80)]` → **KEPT as amber equivalent** per mapping rules (Hasan grade)

## Verification
- Grep for `oklch` in NotesPage.tsx: 0 results
- Grep for `oklch` in SpiritualPage.tsx: 1 result (intentional amber `text-[oklch(0.8_0.12_80)]`)
- All component structure, imports, and logic preserved
- Only color-related class names changed
