---
name: ast-search
description: >-
  Enforces token-efficient code navigation in TypeScript and React using AST/symbol searches and surgical
  line-range reading. Use when exploring, locating, reviewing, or debugging code across the frontend to
  minimize token consumption and avoid dumping large component files into context.
---

# AST Search & Token Optimization (Frontend / TypeScript)

This skill enforces strict, token-efficient code exploration across this TypeScript & React codebase.

---

## 1. Core Principles

1. **Never read entire files blindly**:
   - Avoid calling `view_file` on complete `.tsx`/`.ts` files (often 200–500+ lines) just to find a prop, hook, state, or utility.
   - Reading unnecessary JSX/markup burns context tokens and degrades model reasoning.

2. **Symbol & Signature First**:
   - Locate the symbol (type, interface, hook, schema, or component) via targeted `grep_search` or AST grep before opening the file.
   - Only view the surrounding lines necessary to understand the interface/implementation.

3. **Surgical Line-Range Inspection**:
   - Once the line numbers are identified, read **only** the target scope using `view_file` with explicit `StartLine` and `EndLine` (typically 20–50 lines).

4. **Repository Map via Repomix**:
   - For broad architectural overview or multi-module understanding, rely on `repomix.config.json` compressed output (`pnpm context` / `npx repomix`) rather than inspecting dozens of files.

---

## 2. Targeted Search Patterns for React & TypeScript

Instead of reading whole files, use surgical searches for specific patterns:

### Types, Interfaces & Schemas (Zod)
```bash
# Locate Zod schema definitions
grep_search: Query="export const .*Schema" SearchPath="src"

# Locate TypeScript interfaces and type aliases
grep_search: Query="export interface " SearchPath="src"
grep_search: Query="export type " SearchPath="src"
```

### Components & Props
```bash
# Locate component definition
grep_search: Query="export (const|function) <ComponentName>" SearchPath="src"

# Locate component props interface
grep_search: Query="interface .*Props" SearchPath="src/components"
```

### Hooks & State (Zustand & TanStack Query)
```bash
# Locate Zustand stores
grep_search: Query="create<.*>\(" SearchPath="src"

# Locate custom hooks
grep_search: Query="export (const|function) use" SearchPath="src"

# Locate TanStack queries / mutations
grep_search: Query="(useQuery|useMutation)" SearchPath="src"
```

### API Services & Endpoints
```bash
# Locate API endpoints / axios calls
grep_search: Query="(apiClient|axios)\.(get|post|put|delete|patch)" SearchPath="src"
```

---

## 3. Standard Navigation Workflow

Follow this 3-step sequence for any code exploration task:

```
[1. Targeted Search]
       │
       ▼  `grep_search` (Finds exact file and line number of definition)
       │
[2. Surgical Read]
       │
       ▼  `view_file(AbsolutePath=..., StartLine=..., EndLine=...)`
          (Loads only the target 20–40 lines, never the full component)
       │
[3. Surgical Edit]
       │
       ▼  `replace_file_content` (Edits target lines directly)
```

---

## 4. Rules for the AI Agent

- **DO NOT** read more than 80–100 lines at once unless refactoring or creating a complete file.
- **DO NOT** dump entire component files or directory trees into the context.
- **PREFER** reading types (`*.types.ts`, `*.schema.ts`) over reading `.tsx` render logic when checking contracts.
- **USE** `pnpm context` (or `npx repomix`) when the user asks for a global architectural context export.
