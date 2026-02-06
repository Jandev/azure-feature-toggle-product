# Azure Feature Toggle Tool — Product Overview

## Summary

A user-friendly tool to manage feature toggles for Azure App Configuration resources within your Azure subscription. Designed for non-technical users who need to control feature flags without accessing the Azure Portal.

### Problems Solved

1. **Complex Azure Portal Interface** — The default Azure App Configuration interface is overwhelming for product managers, QA testers, and other non-technical team members. This tool provides a simplified interface focused only on feature toggle controls.

2. **Security and Access Control** — Organizations can control feature flags without granting team members full Azure Portal access, reducing security concerns while maintaining control.

## Planned Sections

This product is built in 5 sections (milestones):

1. **Authentication** — User login and authentication flow. Validates user identity and retrieves their roles to determine permissions (read-only vs. read-write access to feature toggles).

2. **Resource Configuration** — Configure and manage connections to Azure App Configuration resources within the subscription. Users can add multiple App Configuration resources from one or more resource groups, all within the same Azure subscription.

3. **Resource Switcher** — Switch between different Azure App Configuration resources (e.g., dev, staging, production). Visual indicators help prevent accidental changes to production environments. *(Note: This is part of the application shell)*

4. **Feature Toggle Dashboard** — View and manage feature flags for the currently selected App Configuration resource. Toggles are enabled/disabled based on user permissions - read-only users see disabled controls.

5. **Audit Log** — Track all changes to feature toggles, including who made the change, what was changed, and when. Provides accountability and helps troubleshoot issues.

## Data Model

Core entities:

- **User** — Represents a person using the tool with role-based permissions (read-only or read-write)
- **AppConfigurationResource** — Represents an Azure App Configuration resource that the tool connects to
- **FeatureToggle** — Represents a feature flag within an Azure App Configuration resource
- **AuditLogEntry** — Represents a record of a feature toggle change for accountability

Key relationships:
- AppConfigurationResource (1) → (many) FeatureToggle
- User (1) → (many) AuditLogEntry
- FeatureToggle (1) → (many) AuditLogEntry

## Design System

**Colors:**
- Primary: Orange (Tailwind `orange`)
- Secondary: Slate (Tailwind `slate`)
- Neutral: Stone (Tailwind `stone`)

**Typography:**
- Heading: Outfit (Google Fonts)
- Body: Outfit (Google Fonts)
- Mono: JetBrains Mono (Google Fonts)

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, routing structure, and application shell (with resource switcher)
2. **Authentication** — User login and role-based access
3. **Resource Configuration** — Connect and manage Azure App Configuration resources
4. **Feature Toggle Dashboard** — View and manage feature toggles
5. **Audit Log** — Track and display change history

Each milestone has a dedicated instruction document in `product-plan/instructions/incremental/`.
