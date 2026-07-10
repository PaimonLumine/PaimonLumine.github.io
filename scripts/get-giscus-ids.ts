/**
 * Fetches the GitHub repo ID and Discussion category ID needed for Giscus.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_yourtoken npx tsx scripts/get-giscus-ids.ts
 *
 * The token needs `public_repo` scope (or `repo` if the repo is private).
 * Create one at: https://github.com/settings/tokens/new?scopes=public_repo
 *
 * Prerequisites:
 *   1. Discussions must be enabled on the repo (Settings → General → Features → Discussions)
 *   2. An "Announcements" category must exist (created automatically when Discussions is enabled)
 */

const REPO = 'PaimonLumine/blog';

// The GraphQL query giscus.app uses to fetch repo + category IDs
const QUERY = `
  query GetGiscusIds($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      discussionCategories(first: 20) {
        nodes {
          id
          name
          slug
          emoji
        }
      }
    }
  }
`;

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN is not set.');
    console.error('   Create a token at https://github.com/settings/tokens/new?scopes=public_repo');
    console.error('   Then run: GITHUB_TOKEN=ghp_xxx npx tsx scripts/get-giscus-ids.ts');
    process.exit(1);
  }

  const [owner, name] = REPO.split('/');
  console.log(`Fetching Giscus IDs for ${REPO}...\n`);

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY, variables: { owner, name } }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ GitHub API error ${res.status}: ${text}`);
    process.exit(1);
  }

  const json = await res.json() as {
    data?: {
      repository: {
        id: string;
        discussionCategories: {
          nodes: { id: string; name: string; slug: string; emoji: string }[];
        };
      };
    };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    console.error('❌ GraphQL errors:');
    for (const err of json.errors) {
      console.error(`   ${err.message}`);
    }
    console.error('\n   Make sure Discussions is enabled on the repo.');
    process.exit(1);
  }

  const repo = json.data?.repository;
  if (!repo) {
    console.error('❌ Repository not found. Check the repo name and token permissions.');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Giscus Configuration Values');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`  repo:       ${REPO}`);
  console.log(`  repoId:     ${repo.id}\n`);

  console.log('  Discussion categories:\n');
  for (const cat of repo.discussionCategories.nodes) {
    const isAnnouncements = cat.name === 'Announcements';
    const marker = isAnnouncements ? ' ◄── use this for Giscus' : '';
    console.log(`    ${cat.emoji} ${cat.name}`);
    console.log(`       categoryId: ${cat.id}${marker}\n`);
  }

  const announcements = repo.discussionCategories.nodes.find(
    (c) => c.name === 'Announcements'
  );

  console.log('═══════════════════════════════════════════════════');
  if (announcements) {
    console.log('  ✅ Add these to src/site.config.ts:\n');
    console.log(`    giscus.repoId:     '${repo.id}'`);
    console.log(`    giscus.categoryId: '${announcements.id}'`);
  } else {
    console.log('  ⚠ No "Announcements" category found.');
    console.log('     Create one in GitHub: Settings → Discussions → New category');
    console.log('     Choose "Announcements" as the category type.');
  }
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
