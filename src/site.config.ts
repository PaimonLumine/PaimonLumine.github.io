export const siteConfig = {
  title: '詩酒趁年華',
  subtitle: '欲説還休，卻道天涼好個秋',
  description: '欲説還休，卻道天涼好個秋',
  author: 'PaimonLumine',
  lang: 'zh-CN',
  keywords: ['Code', 'ACG', 'PaimonLumine', 'Blog'],
  gaId: 'G-ZQTD8VC7RY',
  social: {
    github: 'https://github.com/paimonlumine',
    email: 'mailto:fxyt34@outlook.com',
    music: 'https://music.163.com/#/user/home?id=98513148',
  },
  weather: {
    apiUrl: 'https://v0.yiketianqi.com/free/day',
    appId: '53266342',
    appSecret: 'mB1eOBjO',
  },
  // Giscus comments — fill in after enabling Discussions on the repo
  // See: https://giscus.app
  giscus: {
    repo: 'PaimonLumine/blog',
    repoId: 'R_kgDOHk9rng',
    category: 'Announcements',
    categoryId: 'DIC_kwDOHk9rns4DA5cF',
    mapping: 'pathname' as const,
    reactionsEnabled: '1',
    inputPosition: 'bottom' as const,
    theme: 'dark',
    lang: 'zh-CN',
  },
};

export type SiteConfig = typeof siteConfig;
