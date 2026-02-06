# Tailwind Color Configuration

## Color Choices

- **Primary:** `orange` — Used for buttons, links, key accents, and call-to-action elements
- **Secondary:** `slate` — Used for tags, highlights, secondary elements, and dark mode backgrounds
- **Neutral:** `stone` — Used for backgrounds, text, borders, and general UI elements

## Tailwind CSS v4 Configuration

In Tailwind CSS v4, you can import the colors directly in your CSS:

```css
@import "tailwindcss";

@theme {
  --color-primary-*: var(--color-orange-*);
  --color-secondary-*: var(--color-slate-*);
  --color-neutral-*: var(--color-stone-*);
}
```

## Usage Examples

**Primary elements:**
- `bg-orange-600 hover:bg-orange-700 text-white` — Primary button
- `text-orange-600 dark:text-orange-400` — Primary link
- `border-orange-200 dark:border-orange-800` — Primary border

**Secondary elements:**
- `bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200` — Secondary badge
- `text-slate-600 dark:text-slate-400` — Secondary text

**Neutral elements:**
- `bg-stone-50 dark:bg-stone-950` — Page background
- `text-stone-600 dark:text-stone-400` — Body text
- `border-stone-200 dark:border-stone-700` — Borders

## Dark Mode

All components use Tailwind's `dark:` variant for dark mode support. Example:

```jsx
<div className="bg-stone-50 dark:bg-stone-950">
  <h1 className="text-stone-900 dark:text-stone-100">Title</h1>
  <p className="text-stone-600 dark:text-stone-400">Body text</p>
</div>
```
