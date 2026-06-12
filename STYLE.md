# Design System

## Color Palette

### Base Colors
| Name | Value | Usage |
|------|-------|-------|
| Background | `#0f0f0f` | Page background |
| Surface | `#1a1a1a` | Cards, panels |
| Border | `#262626` | Dividers, borders |
| Muted | `#3a3a3a` | Disabled, secondary |

### Text Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary | `#f5f5f5` | Main text |
| Secondary | `#9ca3af` | Labels, hints |
| Muted | `#6b7280` | Disabled text |

### Accent Colors
| Name | Value | Activity |
|------|-------|----------|
| Ride | `#f97316` | Cycling |
| Run | `#3b82f6` | Running |
| Walk | `#22c55e` | Walking |
| PR | `#a855f7` | Personal Records |

### Brand
| Name | Value | Usage |
|------|-------|-------|
| Strava | `#fc4c02` | Official Strava orange |

## Typography

### Font Families
- **Sans**: Inter (body text, UI)
- **Mono**: JetBrains Mono (numbers, code)

### Font Sizes
| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem (12px) | Labels, captions |
| `text-sm` | 0.875rem (14px) | Body text |
| `text-base` | 1rem (16px) | Paragraph |
| `text-lg` | 1.125rem (18px) | Subheadings |
| `text-2xl` | 1.5rem (24px) | Section title |
| `text-3xl` | 1.875rem (30px) | Page title |

### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Buttons, labels |
| Semibold | 600 | Headings, emphasis |
| Bold | 700 | Strong emphasis |

## Spacing

### Scale (in rem)
```
0.25rem (4px)    - xs
0.5rem  (8px)    - sm
1rem    (16px)   - base
1.5rem  (24px)   - lg
2rem    (32px)   - xl
2.5rem  (40px)   - 2xl
```

### Usage
- **Page padding**: `px-4 md:px-8 lg:px-12`
- **Card padding**: `p-5` or `p-6`
- **Stat grid gap**: `gap-4`
- **Section spacing**: `mb-8`

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | `rounded-lg` | Inputs, buttons |
| Medium | `rounded-xl` | Cards |
| Large | `rounded-2xl` | Panel cards |

## Shadows

None explicitly used. Subtle borders create depth:
- `border border-border` on surface elements

## Components

### Cards
```tsx
className="bg-surface border border-border rounded-2xl p-5"
```

### Buttons
```tsx
className="px-4 py-2 rounded-lg bg-accent-ride text-white hover:opacity-90 transition-colors"
```

### Inputs
```tsx
className="px-3 py-2 bg-muted text-text-primary rounded-lg text-sm border border-border focus:outline-none"
```

### Stat Cards
- Fixed height: `h-32`
- Flex layout: `flex flex-col justify-between`
- Large monospace text: `text-3xl font-mono`

### Activity Cards
- Hover: `whileHover={{ scale: 1.015, y: -2 }}`
- Transition: Spring physics
- Status icons: Activity type color-coded

## Animations

### Page Transitions
- Duration: 280ms
- Easing: easeOut
- Effect: Slide + fade (opacity 0, y: 14)

### Component Interactions
- Hover: Scale 1.015 + slight lift
- Tap: Scale 0.98
- Spring: `stiffness: 300, damping: 22`

### List Animations
- Stagger children: 70ms delay
- Container easing

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, bottom nav |
| Tablet | 768px-1024px | Icon sidebar, stacked grid |
| Desktop | ≥ 1024px | Full sidebar, multi-column |

## Dark Theme

The entire app uses a dark-first approach:
- No light mode toggle
- Consistent dark theme throughout
- High contrast for accessibility
- WCAG AA compliant color pairs

## Icon System

Using **Lucide React** icons:
- Size: `w-5 h-5` (20px) for default
- Size: `w-6 h-6` (24px) for large
- Colors: Activity-specific or inherit text color
- Stroke width: 2px (default)

## Accessibility

- Color contrast: 4.5:1 minimum on text
- Focus states: Outline on interactive elements
- Keyboard navigation: Full support
- Semantic HTML: Proper heading hierarchy
