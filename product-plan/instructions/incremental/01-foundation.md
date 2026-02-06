# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

**Colors:**
- Primary: Orange (Tailwind `orange`)
- Secondary: Slate (Tailwind `slate`)  
- Neutral: Stone (Tailwind `stone`)

**Typography:**
- Heading: Outfit (Google Fonts)
- Body: Outfit (Google Fonts)
- Mono: JetBrains Mono (Google Fonts)

**Setup Instructions:**

See `product-plan/design-system/tokens.css` for CSS custom properties.

See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration examples.

See `product-plan/design-system/fonts.md` for Google Fonts import code.

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

**Core Entities:**
- `User` — Users with role-based permissions (read-only or admin)
- `AppConfigResource` — Azure App Configuration resources
- `FeatureToggle` — Feature flags within resources
- `AuditLogEntry` — Change history records

See `product-plan/data-model/types.ts` for complete interface definitions.

See `product-plan/data-model/README.md` for entity relationships and design decisions.

Use `product-plan/data-model/sample-data.json` for testing before real APIs are built.

### 3. Routing Structure

Create routes for each section:

- `/` or `/dashboard` → Feature Toggle Dashboard
- `/resources` → Resource Configuration
- `/audit-log` → Audit Log
- `/settings` → Settings (placeholder for now)
- `/login` → Authentication (if separate page)

### 4. Application Shell

The application shell provides persistent navigation and layout structure.

**Copy shell components from `product-plan/shell/components/`:**

- `AppShell.tsx` — Main layout wrapper with sidebar and top nav
- `TopNav.tsx` — Header with logo, resource switcher, user menu
- `Sidebar.tsx` — Collapsible navigation sidebar
- `ResourceSwitcher.tsx` — Dropdown to switch between Azure resources
- `UserMenu.tsx` — User info and logout dropdown

**Wire Up Navigation:**

The Sidebar component expects navigation items. Connect these to your routing:

1. **Dashboard** (home icon) → Feature Toggle Dashboard (`/` or `/dashboard`)
2. **Resources** (server icon) → Resource Configuration (`/resources`)
3. **Audit Log** (list icon) → View change history (`/audit-log`)
4. **Settings** (gear icon) → User settings (`/settings`)

**Resource Switcher Integration:**

The ResourceSwitcher expects:
- `currentResource` — Currently selected Azure App Configuration resource
- `resources` — Array of all configured resources
- `onResourceChange` — Callback when user switches resource

You'll need to:
- Fetch configured resources from your backend
- Store the currently selected resource (global state or context)
- Handle resource switching (update state, refetch toggles)

**User Menu Integration:**

The UserMenu expects:
- `userName` — Current user's name
- `userEmail` — Current user's email
- `userRole` — Either `'read-only'` or `'admin'`
- `onLogout` — Callback to sign out

Connect this to your authentication system.

**Sidebar Collapse State:**

The sidebar collapse state persists to localStorage. The AppShell component handles this automatically.

**Responsive Behavior:**

On mobile (<768px), the sidebar becomes an overlay/drawer. The shell components handle this automatically.

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/data-model/` — Type definitions and sample data
- `product-plan/shell/README.md` — Shell design intent and specifications
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts applied globally)
- [ ] Data model types are defined in your codebase
- [ ] Routes exist for all sections (can be placeholder pages for now)
- [ ] Shell renders with correct branding and layout
- [ ] Sidebar navigation links to correct routes
- [ ] Active section is highlighted in sidebar
- [ ] Resource switcher displays (even if empty/"No resources configured")
- [ ] User menu shows current user info
- [ ] Sidebar collapse/expand works and persists
- [ ] Responsive on mobile (sidebar becomes drawer)
- [ ] Shell works in both light and dark mode
