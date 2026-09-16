---
name: backend-driven
description: >-
  Enforces a strict Backend-Driven Architecture across the application.
  Forbids hardcoding modules, navigation menus, categories, permissions, statuses,
  or entity metadata that the backend provides or should provide.
  Ensures the frontend dynamically adapts to backend catalogs and uses robust,
  safe fallbacks for localization and navigation.
---

# Backend-Driven Architecture & Zero Hardcoding Policy

This skill establishes the non-negotiable architectural principles for ensuring the application is **strictly backend-driven**. The frontend acts as a dynamic projection of backend data, configuration, and permissions.

---

## 1. Zero Hardcoding Policy

**Never hardcode entity types, module lists, categories, actions, or metadata in the frontend.**

### Anti-Patterns to Forbid
- Do not hardcode module arrays (e.g. `['users', 'roles', 'teams', 'audit', 'storage', 'settings']`).
- Do not build static navigation bars or sidebars that assume a fixed set of modules.
- Do not hardcode category mappings or category names (e.g. `business`, `security`, `system`).
- Do not overwrite or bypass backend data with static frontend tables or switch statements.
- Do not introduce duplicate top-level keys in translation files (`translation.json`) that wipe out module catalogues.

### Canonical Patterns to Follow
- Fetch module catalogs directly from the backend (`GET /api/rbac/modules` via `useModules()`).
- Derive navigation, routes, sections, and permissions dynamically from backend responses.
- Rely on backend attributes for module metadata:
  - `code` / `slug`: Unique identifier.
  - `name`: Authoritative default display name.
  - `category`: Category grouping key (`business`, `security`, `system`, `files`, etc.).
  - `categoryName`: Authoritative default category label.
  - `categoryOrder` / `sortOrder`: Authoritative display order.
  - `icon`: Suggested icon key.
  - `isActive`: Whether the module is active.
  - `requiresSuperAdmin`: Superadmin access requirement.
  - `supportedActions`: Allowed actions (`CREATE`, `READ`, `UPDATE`, `DELETE`, `EXPORT`, `RESTORE`, `REVOKE`, etc.).

---

## 2. Dynamic Translation & Safe Fallback Pattern

Translations (`i18n`) exist solely as an internationalization and localization layer (e.g. Spanish vs. English), **never as a replacement for backend catalogs**.

### Module Name Resolution
Always provide the backend-provided name as the default value:
```typescript
// Correct pattern:
const displayName = t(`modules.names.${cleanCode}`, {
  defaultValue: module.name || cleanCode,
});
```
If the translation key is missing, the UI gracefully renders the backend's `module.name`.

### Category Label Resolution
Always provide the backend-provided category name as the default value:
```typescript
// Correct pattern:
const groupTitle = t(`modules.categories.${categoryKey}`, {
  defaultValue: module.categoryName || module.category || categoryKey,
});
```

### Translation File Integrity
- All module names belong under the single, authoritative `modules.names` object in `translation.json`.
- All module categories belong under `modules.categories`.
- **NEVER append duplicate `"modules": { ... }` blocks** at the end of translation files. Duplicate JSON keys overwrite previous definitions and destroy the entire catalogue.

---

## 3. Dynamic Navigation & Permission Gating

Navigation menus and route guards must be completely dynamic:

1. **Modules Query**: Read from `useModules()`, which caches and provides the authoritative list of active modules.
2. **Access Check**: Filter items dynamically using `isSuperAdmin || can(module.code, 'READ')`.
3. **Partitioning**: Group by `categoryKey` (`business` for main app routes, non-business for `/admin` routes).
4. **Ordering**: Sort groups by `categoryOrder`, and items within groups by `sortOrder`.
5. **Route Resolution**: Use `getModuleRoute(moduleCode)` with dynamic fallback to `/${moduleCode}` or `/admin/${moduleCode}`.
6. **Icon Resolution**: Use `getModuleIcon(iconName, moduleCode)` with dynamic fallback to `LayoutGrid`.

---

## 4. Entity Selectors, Filters & Dropdowns

Dropdowns and filters that select modules or entities (e.g. in Audit Logs, Recycle Bin / Trash, Background Jobs, Permissions) must consume dynamic backend hooks:

- Use `useModulesOptions()` to populate module filter options.
- Use `useEntityTrashModulesOptions()` for modules supporting trash/restore actions.
- Use `modulesMap` (from `useModules()`) to dynamically map module slugs to their localized names.

---

## 5. Review Checklist

Before finishing any change or reviewing code, verify:

1. [ ] Did I introduce any hardcoded module or category string arrays?
2. [ ] Does this feature adapt automatically if a new module is added to the backend?
3. [ ] Are module display names using `t('modules.names.<code'>, { defaultValue: module.name })`?
4. [ ] Are translation JSON files free of duplicate top-level keys?
5. [ ] Is permission gating checking against backend-supported actions rather than hardcoded assumptions?
