# Application Shell

The application shell provides the persistent navigation and layout structure for the Azure Feature Toggle Tool.

## Components

### AppShell
Main layout wrapper that orchestrates the entire shell experience.

**Features:**
- Manages sidebar collapse state (persists to localStorage)
- Coordinates TopNav and Sidebar components
- Provides responsive main content area
- Handles dark mode styling

**Props:**
- `currentResource` — Currently selected Azure App Configuration resource
- `resources` — Array of all configured resources
- `onResourceChange` — Callback when user switches resource
- `userName`, `userEmail`, `userRole` — Current user information
- `onLogout` — Callback to sign out
- `activeSection` — Currently active navigation section
- `onNavigate` — Callback when user navigates to a section
- `children` — Main content to render

### TopNav
Fixed header with branding, resource switcher, and user menu.

**Features:**
- Sidebar toggle button
- Application branding (responsive)
- Resource switcher (center)
- User menu (right)

### Sidebar
Collapsible navigation sidebar with section links.

**Features:**
- Four navigation items (Dashboard, Resources, Audit Log, Settings)
- Visual active state indicator
- Collapses to icon-only mode (240px → 60px)
- Responsive: becomes overlay on mobile

**Navigation Items:**
- Dashboard (LayoutDashboard icon) → Feature Toggle Dashboard
- Resources (Server icon) → Resource Configuration
- Audit Log (FileText icon) → View change history
- Settings (Settings icon) → User settings

### ResourceSwitcher
Dropdown to switch between configured Azure resources.

**Features:**
- Shows current resource name and environment badge
- Environment badges color-coded (development=blue, staging=yellow, production=red)
- Dropdown lists all available resources
- Clicking a resource triggers `onResourceChange`

### UserMenu
User profile dropdown with logout option.

**Features:**
- User avatar with initials
- Displays user name, email, and role badge
- Role badge color-coded (admin=orange, read-only=slate)
- Profile menu item (placeholder)
- Logout action

## Design Details

**Layout:**
- Top nav: Fixed at top, 64px height
- Sidebar: Fixed at left, 240px width (expanded) or 60px (collapsed)
- Main content: Offset by top nav and sidebar, full-height

**Colors:**
- Background: `stone-50` (light), `slate-950` (dark)
- Sidebar background: `orange-50` (light), `slate-900` (dark)
- Active nav item: `orange-100` background, `orange-600` border
- Hover state: `orange-100` (light), `slate-800` (dark)

**Responsive Behavior:**
- Desktop (≥1024px): Sidebar always visible, can collapse
- Tablet (768px-1024px): Sidebar visible, can collapse
- Mobile (<768px): Sidebar becomes overlay/drawer (implementation detail)

## Dependencies

These components depend on:
- **lucide-react** — Icons (LayoutDashboard, Server, FileText, Settings, Menu, ChevronDown, LogOut, User)
- **shadcn/ui components** — Button, Avatar, Badge, DropdownMenu
  - Install via: `npx shadcn@latest add button avatar badge dropdown-menu`
  - Or implement your own versions
- **cn() utility** — Tailwind class name utility (from `@/lib/utils`)
  - Simple implementation: `export const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')`

## Integration Notes

1. **Wrap your application** with the AppShell component
2. **Pass all required props** including current resource, user info, callbacks
3. **Handle navigation** in your `onNavigate` callback (update routes)
4. **Handle resource switching** in your `onResourceChange` callback (update state, refetch toggles)
5. **Provide children** — The main content for each section

## Example Usage

```tsx
<AppShell
  currentResource={currentResource}
  resources={allResources}
  onResourceChange={(resource) => {
    setCurrentResource(resource);
    refetchToggles(resource.id);
  }}
  userName="Sarah Chen"
  userEmail="sarah.chen@company.com"
  userRole="admin"
  onLogout={() => {
    // Clear session, redirect to login
  }}
  activeSection="dashboard"
  onNavigate={(section) => {
    router.push(`/${section}`);
  }}
>
  {/* Your page content goes here */}
  <DashboardContent />
</AppShell>
```

## Notes

- The shell components use `@/` imports for utilities and UI components — adjust these paths to match your project structure
- LocalStorage key for sidebar state: `'sidebar-collapsed'`
- All components support dark mode via Tailwind's `dark:` variants
