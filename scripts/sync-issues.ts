/**
 * Syncs blog content from GitHub Issues into Markdown files.
 *
 * Source: https://github.com/PaimonLumine/blog (Issues)
 * Target: src/content/posts/*.md
 *
 * Run: pnpm sync  (or automatically via prebuild hook)
 *
 * Requires GITHUB_TOKEN env var for authenticated requests (avoids 60 req/hr
 * rate limit). In GitHub Actions, GITHUB_TOKEN is automatically available.
 */

import { writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'PaimonLumine/blog';
const POSTS_DIR = join(process.cwd(), 'src', 'content', 'posts');

// Default GitHub labels to filter out (not content labels)
const DEFAULT_LABELS = new Set([
  'bug', 'documentation', 'duplicate', 'enhancement',
  'good first issue', 'help wanted', 'invalid', 'question', 'wontfix',
]);

// Singleton "page" labels — rendered on dedicated routes, excluded from the
// home feed post listing.
const SINGLETON_LABELS = new Set(['About', 'Book', 'Friend', 'Project']);

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  state: 'open' | 'closed';
  labels: { name: string }[];
  milestone: { title: string } | null;
}

interface ParsedBody {
  cover: string | null;
  body: string;
}

/**
 * Extracts a cover/thumbnail image from the issue body.
 *
 * Strategy (in priority order):
 * 1. Strip the Pixiv-theme cover marker `[key]: #'url'` from the top of the
 *    body — but only use it as the cover if it's not a generic reference link
 *    that appears across multiple posts.
 * 2. Fall back to the first inline image in the body: `![alt](url)`
 *
 * The Pixiv cover marker is always stripped from the body regardless of
 * whether it's used as the cover, since it's a reference definition that
 * doesn't render as content.
 */
function parseCover(body: string): ParsedBody {
  if (!body) return { cover: null, body: '' };

  const lines = body.split('\n');
  const coverPattern = /^\[[^\]]*\]:\s*#?\s*['"]([^'"]+)['"]/;
  const match = lines[0]?.match(coverPattern);

  let cleanBody = body;
  let pixivCover: string | null = null;

  if (match) {
    pixivCover = match[1];
    cleanBody = lines.slice(1).join('\n').replace(/^\n+/, '');
  }

  // Fall back to the first inline image in the body
  const inlineImagePattern = /!\[[^\]]*\]\(([^)]+)\)/;
  const inlineMatch = cleanBody.match(inlineImagePattern);
  const inlineCover = inlineMatch ? inlineMatch[1] : null;

  // Prefer the inline image — the Pixiv cover marker is often a stale
  // reference link copy-pasted across posts (e.g. cs231n image).
  // Only use the Pixiv cover if there's no inline image.
  const cover = inlineCover || pixivCover;

  return { cover, body: cleanBody };
}

/**
 * Converts a title to a URL-safe slug.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-word chars (handles CJK too)
    .replace(/[\s_]+/g, '-')  // spaces/underscores → hyphens
    .replace(/-+/g, '-')      // collapse multiple hyphens
    .replace(/^-|-$/g, '');   // trim leading/trailing hyphens
}

/**
 * Escapes a string for safe inclusion in YAML frontmatter.
 */
function yamlEscape(str: string): string {
  if (!str) return '""';
  // Wrap in double quotes, escape backslashes and double quotes
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function fetchIssues(): Promise<GitHubIssue[]> {
  const url = `https://api.github.com/repos/${REPO}/issues?state=all&per_page=100`;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'paimonlumine-blog-sync',
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠ GITHUB_TOKEN not set — using unauthenticated requests (60 req/hr limit)');
  }

  console.log(`Fetching issues from ${REPO}...`);
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  const issues = (await res.json()) as GitHubIssue[];
  // Filter out pull requests (the Issues API returns PRs too)
  return issues.filter((i) => !(i as { pull_request?: unknown }).pull_request);
}

function issueToMarkdown(issue: GitHubIssue): string {
  const { cover, body: cleanBody } = parseCover(issue.body ?? '');

  const contentLabels = issue.labels
    .map((l) => l.name)
    .filter((name) => !DEFAULT_LABELS.has(name));

  const isSingleton = contentLabels.some((l) => SINGLETON_LABELS.has(l));

  const frontmatter = [
    '---',
    `title: ${yamlEscape(issue.title)}`,
    `number: ${issue.number}`,
    `date: ${issue.created_at}`,
    `updated: ${issue.updated_at}`,
    `state: ${issue.state}`,
    `labels: [${contentLabels.map((l) => yamlEscape(l)).join(', ')}]`,
    `milestone: ${issue.milestone ? yamlEscape(issue.milestone.title) : 'null'}`,
    `isSingleton: ${isSingleton}`,
    `draft: false`,
  ];

  if (cover) {
    frontmatter.push(`cover: ${yamlEscape(cover)}`);
  }

  frontmatter.push('---', '');

  return frontmatter.join('\n') + cleanBody.replace(/\r\n/g, '\n');
}

function clearPostsDir() {
  if (!existsSync(POSTS_DIR)) {
    mkdirSync(POSTS_DIR, { recursive: true });
    return;
  }
  for (const file of readdirSync(POSTS_DIR)) {
    if (file.endsWith('.md')) {
      unlinkSync(join(POSTS_DIR, file));
    }
  }
}

async function main() {
  clearPostsDir();

  const issues = await fetchIssues();
  console.log(`Found ${issues.length} issues`);

  let synced = 0;
  for (const issue of issues) {
    const slug = slugify(issue.title) || `post-${issue.number}`;
    const filename = `${String(issue.number).padStart(3, '0')}-${slug}.md`;
    const filepath = join(POSTS_DIR, filename);
    const markdown = issueToMarkdown(issue);
    writeFileSync(filepath, markdown, 'utf-8');
    synced++;
    console.log(`  ✓ #${issue.number} → ${filename}`);
  }

  console.log(`\nDone! Synced ${synced} posts to ${POSTS_DIR}`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
