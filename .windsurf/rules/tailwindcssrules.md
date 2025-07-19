---
trigger: always_on
---

---
name: tailwind_v4_migration
description: Complete guide for using Tailwind CSS v4.1.11 with CSS-first configuration, modern features, and best practices for frontend development
globs: ["**/*.{js,ts,jsx,tsx,mdx,css,html}"]
tags:
  - tailwindcss
  - css
  - frontend
  - v4
---

# Tailwind CSS v4.1.11 Configuration Guide

## Package Installation

Use these exact package configurations:

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.11",
    "@tailwindcss/cli": "^4.1.11",
    "@tailwindcss/vite": "^4.1.11"
  }
}
```

**Remove these v3 packages:**
- `tailwindcss`
- `autoprefixer`
- `postcss-import`

## PostCSS Configuration

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

## CSS-First Configuration

**Primary theme file structure:**
```css
@import "tailwindcss";

@theme {
  /* Color System - Use OKLCH for better color accuracy */
  --color-primary-50: oklch(0.98 0.05 290);
  --color-primary-100: oklch(0.95 0.1 290);
  --color-primary-200: oklch(0.87 0.2 290);
  --color-primary-300: oklch(0.75 0.35 290);
  --color-primary-400: oklch(0.65 0.45 290);
  --color-primary-500: oklch(0.58 0.25 290); /* A855F7 */
  --color-primary-600: oklch(0.52 0.28 290); /* 9333EA */
  --color-primary-700: oklch(0.45 0.3 290);  /* 7E22CE */
  --color-primary-800: oklch(0.38 0.32 290); /* 6B21A8 */
  --color-primary-900: oklch(0.32 0.35 290); /* 581C87 */
  --color-primary: oklch(0.65 0.2 210);      /* 0ea5e9 */
  
  --color-bluish: oklch(0.65 0.15 250);
  --color-greenish: oklch(0.75 0.2 140);
  
  /* Background variants */
  --color-bg-light: oklch(0.95 0.005 0);
  --color-bg-blue: oklch(0.95 0.05 210);
  --color-bg-lavender: oklch(0.9 0.1 270);
  --color-bg-mint: oklch(0.9 0.1 160);
  
  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Inter", "Satoshi", sans-serif;
  
  /* Spacing system */
  --spacing: 0.25rem;
  
  /* Custom shadows */
  --drop-shadow-text-glow: 0 0 4px rgba(0,0,0,0.4);
  
  /* Breakpoints */
  --breakpoint-3xl: 1920px;
  
  /* Animation easing */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}
```

## Custom Utilities and Variants

```css
/* Custom utilities */
@utility text-glow {
  filter: drop-shadow(var(--drop-shadow-text-glow));
}

@utility field-auto {
  field-sizing: content;
}

/* Custom variants */
@variant dark (&:where(.dark, .dark *));
@variant theme-custom (&:where([data-theme="custom"] *));
@variant pointer-coarse (@media (pointer: coarse));

/* Plugins */
@plugin "@tailwindcss/typography";
```

## Breaking Changes from v3

### Utility Renames (MUST UPDATE):
- `shadow-xs` → `shadow-2xs`
- `shadow-sm` → `shadow-xs`
- `drop-shadow-xs` → `drop-shadow-xs`
- `drop-shadow-sm` → `drop-shadow-xs`
- `blur-xs` → `blur-xs`
- `blur-sm` → `blur-xs`
- `rounded-xs` → `rounded-xs`
- `rounded-sm` → `rounded-xs`
- `outline-hidden` → `outline-hidden` (for old behavior)

### Opacity Syntax Changes:
```css
/* OLD v3 */
bg-primary-500 bg-opacity-50
text-primary-600 text-opacity-75

/* NEW v4 */
bg-primary-500/50
text-primary-600/75
```

### CSS Variable Access:
```css
/* OLD v3 arbitrary values */
bg-(--brand-color)

/* NEW v4 arbitrary values */
bg-(--brand-color)
```

## New v4 Features

### Container Queries (Native Support):
```html
<div class="@container">
  <div class="@sm:flex @md:grid-cols-2 @lg:hidden">
    Responsive to container size
  </div>
</div>
```

### 3D Transforms:
```html
<div class="transform-3d rotate-x-45 rotate-y-30 perspective-1000 backface-hidden">
  3D transformed element
</div>
```

### Enhanced Gradients:
```html
<!-- Linear with angles -->
<div class="bg-linear-45 from-primary-500 to-bluish"></div>

<!-- Color space interpolation -->
<div class="bg-linear-to-r/oklch from-primary-500 to-greenish"></div>

<!-- Conic and radial -->
<div class="bg-conic from-primary-500 to-bluish"></div>
<div class="bg-radial-[at_25%_25%] from-primary-500 to-transparent"></div>
```

### Composable Variants:
```html
<div class="hover:group-has-data-active:bg-primary-500">
  Complex state combinations
</div>
```

### New Variants Available:
- `starting` - for @starting-style transitions
- `not-*` - for :not() pseudo-class
- `inert` - for inert attribute
- `nth-*` - nth-child variants (`nth-3:`, `nth-last-5:`)
- `in-*` - like group-* but without adding group class
- `**` - targets all descendants

### Shadow Enhancements:
```html
<!-- Inset shadows -->
<div class="inset-shadow-md shadow-lg">
  Combined inner and outer shadows
</div>

<!-- Inset rings -->
<div class="inset-ring-2 inset-ring-primary-500 ring-4 ring-bluish">
  Combined inner and outer rings
</div>
```

## Best Practices

### Theme Organization:
```css
@theme {
  /* Colors first */
  --color-*: value;
  
  /* Typography second */
  --font-*: value;
  --text-*: value;
  
  /* Spacing and layout */
  --spacing-*: value;
  --breakpoint-*: value;
  
  /* Effects last */
  --shadow-*: value;
  --ease-*: value;
}
```

### Component Patterns:
```css
/* Reference theme in components */
@import "tailwindcss/theme" theme(reference);

.component {
  @apply bg-primary-500/10 text-primary-900;
  border: 1px solid var(--color-primary-200);
}
```

### Advanced Configuration:
```css
/* With prefix */
@import "tailwindcss" prefix(tw);

/* Custom sources */
@source "../components/**/*.{js,ts,jsx,tsx}";

/* Legacy config import */
@config "./legacy.config.js";
```

## Migration Checklist

- [ ] Update package.json (remove old tailwindcss, add @tailwindcss/postcss)
- [ ] Update postcss.config.js
- [ ] Create CSS theme file with @theme directive
- [ ] Convert colors to OKLCH format
- [ ] Update deprecated utility classes
- [ ] Replace opacity utilities with new syntax
- [ ] Test container queries if needed
- [ ] Verify custom CSS still works
- [ ] Remove tailwind.config.js file

## Default Behavior Changes

- Default border color is now `currentColor` (was `gray-200`)
- Default `ring-3` width is 1px (was 3px)  
- Placeholder text uses current color at 50% opacity (was `gray-400`)
- Hover styles only apply on devices supporting hover (`@media (hover: hover)`)

## Performance Benefits

- Faster build times with CSS-first configuration
- Smaller bundle sizes
- Native CSS features (layers, container queries)
- Better tree-shaking
- Reduced JavaScript overhead

## Debugging Tips

- Use browser DevTools to inspect CSS variables: `var(--color-primary-500)`
- Check for deprecated utility warnings in console
- Verify @theme variables are properly defined
- Test container queries with DevTools responsive mode
- Use `@import "tailwindcss" prefix(debug)` for debugging builds