# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Or import in your CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

## Font Usage

- **Headings:** Outfit — Clean, modern sans-serif font perfect for headings and titles
- **Body text:** Outfit — Same font for consistent, clean appearance throughout the UI
- **Code/technical:** JetBrains Mono — Monospace font for code snippets, technical identifiers, and data

## CSS Configuration

```css
body {
  font-family: 'Outfit', sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', sans-serif;
}

code, pre, .font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

## Tailwind Configuration

In your Tailwind config or CSS:

```css
@theme {
  --font-family-sans: 'Outfit', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
}
```
