<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions

## Project

This is a professional website built for a real or fictional client.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## General rules

- Use TypeScript.
- Prefer reusable React components.
- Avoid unnecessarily large components.
- Keep the project structure organized.
- Do not add dependencies unless there is a clear reason.
- Do not remove existing functionality without explicit approval.
- Preserve existing behavior when modifying code.
- Prefer simple solutions over unnecessary abstraction.

## UI

- Design mobile-first.
- The website must be fully responsive.
- Use semantic HTML.
- Prioritize accessibility.
- Use clear visual hierarchy.
- Keep spacing consistent.
- Avoid excessive animations.
- Use accessible color contrast.
- Always consider mobile, tablet and desktop.

## Next.js

- Use App Router.
- Use Server Components by default.
- Use Client Components only when interaction or browser APIs require them.
- Use next/image for images where appropriate.
- Use next/link for internal navigation.
- Configure metadata for SEO.

## Code quality

- Use descriptive names.
- Avoid duplicated logic.
- Keep components focused.
- Prefer readable code over clever code.
- Do not introduce unnecessary design patterns.

## Security

- Never hardcode API keys, passwords, tokens or secrets.
- Never expose private environment variables to client-side code.
- Use environment variables for secrets.
- Never commit .env.local.

## AI behavior

Before implementing a complex feature:

1. Inspect the existing project.
2. Identify the files that need to change.
3. Explain the proposed approach.
4. Identify possible risks.
5. Then implement.

For larger tasks, divide the work into small steps.

After making changes:

1. Explain what changed.
2. List the files modified.
3. Tell me how to test the change.
4. Mention any potential issues.

Do not rewrite unrelated files.

Do not invent APIs, database schemas or external services without telling me.

When something fails, investigate the root cause before attempting a fix.
