/**
 * SEO Constants for Ngirit Application
 * Centralized SEO configuration for meta tags, Open Graph, Twitter Cards, and structured data
 */

export const SEO_CONFIG = {
  // Base configuration
  siteName: 'Ngirit',
  siteUrl: process.env.NUXT_PUBLIC_HOST || 'https://ngirit.app',
  defaultLocale: 'id_ID',

  // Default meta tags
  defaultTitle: 'Ngirit - Aplikasi Pencatat Keuangan Pribadi',
  defaultDescription:
    'Kelola keuangan pribadi dan keluarga dengan mudah. Catat pengeluaran, lacak anggaran, dan kelola keuangan bersama keluarga. Gratis dan mudah digunakan.',
  defaultKeywords: [
    'aplikasi keuangan',
    'pencatat pengeluaran',
    'manajemen keuangan',
    'budgeting',
    'keuangan keluarga',
    'ngirit',
    'hemat uang',
    'tracking pengeluaran',
    'finance app',
    'money management',
  ].join(', '),

  // Social media
  twitterHandle: '@tuan_yudha',
  twitterCreator: '@tuan_yudha',

  // Images
  ogImage: '/images/logo.webp',
  twitterImage: '/images/logo.webp',
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',

  // Organization info for structured data
  organization: {
    name: 'Ngirit',
    url: process.env.NUXT_PUBLIC_HOST || 'https://ngirit.app',
    logo: '/images/logo.png',
    description: 'Aplikasi pencatat keuangan pribadi dan keluarga',
    foundingDate: '2014',
    sameAs: [
      'https://x.com/tuan_yudha',
      'https://www.instagram.com/gajayana/',
      'https://www.linkedin.com/in/yudhawijaya/',
    ],
  },

  // App info for structured data
  app: {
    name: 'Ngirit',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      price: '0',
      priceCurrency: 'IDR',
    },
  },
} as const;

/**
 * Page-specific SEO configurations
 */
export const PAGE_SEO = {
  home: {
    title: 'Ngirit - Biar Dompet Gak Nangis di Akhir Bulan',
    description:
      'Aplikasi pencatat keuangan pribadi yang mudah dan gratis. Catat setiap pengeluaran, lacak anggaran bulanan, dan kelola keuangan keluarga dengan Ngirit.',
    keywords:
      'aplikasi keuangan gratis, pencatat pengeluaran, manajemen keuangan pribadi, budgeting Indonesia, keuangan keluarga',
  },

  dashboard: {
    title: 'Dashboard - Ngirit',
    description:
      'Lihat ringkasan pengeluaran harian dan bulanan Anda. Pantau keuangan dengan mudah di dashboard Ngirit.',
    keywords: 'dashboard keuangan, ringkasan pengeluaran, tracking pengeluaran harian',
  },

  profile: {
    title: 'Profil Saya - Ngirit',
    description:
      'Kelola informasi akun dan pengaturan aplikasi Ngirit Anda. Atur keluarga dan preferensi aplikasi.',
    keywords: 'profil pengguna, pengaturan akun, manajemen keluarga',
  },
} as const;

/**
 * Generate full page title
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  return `${pageTitle} | ${SEO_CONFIG.siteName}`;
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = SEO_CONFIG.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate Open Graph meta tags
 */
export function getOpenGraphTags(options: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}) {
  const { title, description, image, url, type = 'website' } = options;

  return {
    ogTitle: title,
    ogDescription: description,
    ogImage: image || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.ogImage}`,
    ogUrl: url || SEO_CONFIG.siteUrl,
    ogType: type,
    ogSiteName: SEO_CONFIG.siteName,
    ogLocale: SEO_CONFIG.defaultLocale,
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function getTwitterCardTags(options: {
  title: string;
  description: string;
  image?: string;
  card?: 'summary' | 'summary_large_image';
}) {
  const { title, description, image, card = 'summary_large_image' } = options;

  return {
    twitterCard: card,
    twitterSite: SEO_CONFIG.twitterHandle,
    twitterCreator: SEO_CONFIG.twitterCreator,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.twitterImage}`,
  };
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.organization.name,
    url: SEO_CONFIG.organization.url,
    logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.organization.logo}`,
    description: SEO_CONFIG.organization.description,
    foundingDate: SEO_CONFIG.organization.foundingDate,
    sameAs: SEO_CONFIG.organization.sameAs,
  };
}

/**
 * Generate JSON-LD structured data for WebApplication
 */
export function getWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SEO_CONFIG.app.name,
    url: SEO_CONFIG.siteUrl,
    applicationCategory: SEO_CONFIG.app.applicationCategory,
    operatingSystem: SEO_CONFIG.app.operatingSystem,
    offers: {
      '@type': 'Offer',
      price: SEO_CONFIG.app.offers.price,
      priceCurrency: SEO_CONFIG.app.offers.priceCurrency,
    },
    description: SEO_CONFIG.defaultDescription,
  };
}

/**
 * Generate JSON-LD structured data for BreadcrumbList
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
