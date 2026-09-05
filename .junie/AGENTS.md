# Junie Development Guidelines

## Stack Conventions
- Framework: SvelteKit (Svelte 5 runtimes, $state, $derived if applicable).
- Style: Tailwind CSS for all styling. Clean, mobile-first layouts.
- Database & Auth: Supabase JS Client (`@supabase/supabase-js`).
- Types: Strict TypeScript (`lang="ts"` inside Svelte components).

## Execution Rules
- Always run `npx svelte-check` after making structural UI changes to verify TypeScript/Svelte types compile clean.
- Never write credentials, API keys, or S3 secrets in code; always construct a `.env.example` template and use `import.meta.env`.
- Minimize dependencies: use native Web APIs (e.g., `navigator.wakeLock`, `navigator.share`) over heavy npm libraries.

## Code Style
- Keep Svelte components modular and concise.
- Provide defensive fallback logic for file uploads and network failures (e.g., mobile offline handling).