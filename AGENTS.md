# AGENTS.md

## Repository purpose

GitHub Pages **user site** for PaimonLumine (`https://paimonlumine.github.io`).
Built with **Astro v5** + React islands + Tailwind CSS v4. A personal blog titled
"詩酒趁年華" (zh-CN, literary/poetic themed). Pushing to `master` triggers a
GitHub Actions workflow that builds and deploys the site automatically.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at localhost:4321
pnpm sync             # fetch blog posts from GitHub Issues → src/content/posts/*.md
pnpm build            # run sync (prebuild hook) + astro build → dist/
pnpm preview          # preview the built site locally

# One-time setup (Giscus comments):
GITHUB_TOKEN=ghp_xxx npx tsx scripts/get-giscus-ids.ts
# → outputs repoId and categoryId to paste into src/site.config.ts
```

**Node 22+ required.** pnpm is the package manager (lockfile committed).

## Architecture

### Content pipeline

Blog content is **GitHub Issues** in the `PaimonLumine/blog` repo, not local
Markdown files. The sync script (`scripts/sync-issues.ts`) fetches issues via
the GitHub REST API and writes them as `.md` files into `src/content/posts/`.

- `pnpm sync` runs automatically before `pnpm build` (via the `prebuild` hook).
- In GitHub Actions, `GITHUB_TOKEN` is passed as an env var (auto-available).
- Locally without a token, it uses unauthenticated requests (60 req/hr limit).
- The sync script is **idempotent** — it clears `src/content/posts/` before
  writing, so re-running always produces a clean state.
- **Do not hand-edit synced `.md` files** — they will be overwritten on the next
  sync. To change content, edit the corresponding GitHub Issue.

### Content Collections

Defined in `src/content.config.ts`. One collection (`posts`) with a Zod schema:
`title`, `number`, `date`, `updated`, `state`, `labels`, `milestone`,
`isSingleton`, `draft`, `cover`.

- Singleton pages (About, Book, Friend, Project) are flagged via
  `isSingleton: true` — they're excluded from the home feed but rendered on
  dedicated routes (`/about`, `/book`, `/project`, `/friend`).
- Regular posts are listed on the home page and accessible at `/post/{number}`.

### Key files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro config — site URL, integrations, Shiki themes |
| `src/site.config.ts` | Site metadata, social links, weather API, Giscus config |
| `src/content.config.ts` | Content Collection schema (Zod) |
| `scripts/sync-issues.ts` | GitHub Issues → Markdown sync pipeline |
| `src/data/poetry.ts` | 37 classical Chinese poems for the typing animation |
| `src/layouts/BaseLayout.astro` | Global layout — head, GA, fonts, nav, footer |
| `src/components/PoetryTyping.tsx` | React island — typed.js poem cycling |
| `src/components/WeatherWidget.tsx` | React island — live weather + animated SVGs |
| `src/components/Giscus.astro` | Comments — needs manual setup (see below) |
| `.github/workflows/deploy.yml` | CI/CD — builds and deploys to GitHub Pages |

### Design system

- Dark theme with literary aesthetic (deep ink background, paper-colored text).
- Fonts: GuDianMingChaoTi (self-hosted, for titles), Noto Serif SC + Fira Mono
  (Google Fonts).
- Colors defined as CSS custom properties in `src/styles/global.css` under
  `@theme`.
- Shooting stars and scroll-reveal animations are CSS/JS-based (no AOS library).

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to
`master`. It uses `withastro/action@v3` to install, build, and upload the site,
then `actions/deploy-pages@v4` to deploy.

**GitHub Pages source must be set to "GitHub Actions"** (not "Deploy from a
branch") in the repo Settings → Pages.

## Known gotchas

- **Giscus comments need manual setup.** Fill in `repoId` and `categoryId` in
  `src/site.config.ts` after enabling Discussions on `PaimonLumine/blog` and
  configuring at https://giscus.app. Until then, the comment section is empty.
- **Weather API may be expired.** The yiketianqi free API credentials in
  `siteConfig.weather` may no longer work. The widget degrades gracefully
  (hides on API failure). Update credentials if needed.
- **pnpm "ignored builds" warning.** pnpm warns about esbuild/sharp build
  scripts being ignored. This is harmless — the prebuilt binaries work fine.
  To suppress, run `pnpm approve-builds` interactively.
- **Old URL compatibility.** The old site used hash routing (`/#/post/14`).
  A redirect script in `BaseLayout.astro` catches these and redirects to
  `/post/14`.
- **Issue #2 gap.** GitHub Issues skip #2 (deleted). The sync script tolerates
  gaps — don't assume contiguous numbering.
