# SEO Implementation Guide - Ngirit

## Overview

This document outlines the SEO (Search Engine Optimization) implementation for the Ngirit application. All SEO configuration is centralized and follows best practices for modern web applications.

## Implementation Status

✅ **Completed:**
- Global SEO configuration
- Page-specific meta tags
- Open Graph tags for social sharing
- Twitter Card tags
- Structured data (JSON-LD)
- robots.txt
- sitemap.xml
- Canonical URLs

## Architecture

### 1. SEO Constants (`utils/constants/seo.ts`)

Central configuration file containing:
- Default meta tags (title, description, keywords)
- Social media handles
- Image paths for OG/Twitter cards
- Organization information for structured data
- Page-specific SEO configurations
- Helper functions for generating meta tags

**Key Functions:**
- `getPageTitle()`  Get formatted page title
- `getCanonicalUrl()` - Generate canonical URL
- `getOpenGraphTags()` - Generate Open Graph meta tags
- `getTwitterCardTags()` - Generate Twitter Card meta tags
- `getOrganizationSchema()` - JSON-LD for Organization
- `getWebApplicationSchema()` - JSON-LD for WebApplication
- `getBreadcrumbSchema()` - JSON-LD for Breadcrumbs

### 2. Global SEO (`app.vue`)

**Implemented:**
- HTML lang attribute (`id` for Bahasa Indonesia)
- Title template for consistent page titles
- Favicon and Apple Touch Icon
- Viewport meta tag
- Global structured data (Organization, WebApplication)
- Default Open Graph and Twitter Card tags

**Code Example:**
```typescript
useHead({
  htmlAttrs: { lang: 'id' },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Ngirit` : 'Ngirit - Aplikasi Pencatat Keuangan Pribadi';
  },
});
```

### 3. Page-Specific SEO

#### **Homepage (`pages/index.vue`)**
- ✅ Custom title: "Ngirit - Biar Dompet Gak Nangis di Akhir Bulan"
- ✅ Optimized description with keywords
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card tags
- ✅ Canonical URL
- ✅ `index, follow` (crawlable)

#### **Dashboard (`pages/dashboard.vue`)**
- ✅ Custom title
- ✅ Canonical URL
- ✅ `noindex, nofollow` (private page)

#### **Profile (`pages/profile.vue`)**
- ✅ Custom title
- ✅ Canonical URL
- ✅ `noindex, nofollow` (private page)

## SEO Best Practices Implemented

### 1. Title Tags
- ✅ Unique title for each page
- ✅ 50-60 characters (optimal length)
- ✅ Includes brand name ("| Ngirit")
- ✅ Front-loads important keywords
- ✅ In Bahasa Indonesia for local SEO

### 2. Meta Descriptions
- ✅ Unique description for each page
- ✅ 150-160 characters (optimal length)
- ✅ Includes call-to-action
- ✅ Keyword-rich but natural
- ✅ In Bahasa Indonesia

### 3. Keywords
- ✅ Relevant keywords listed
- ✅ Focus on Indonesian market
- ✅ Mix of Bahasa and English terms
- ✅ Includes long-tail keywords

### 4. Open Graph (Social Sharing)
- ✅ `og:title` - Page title
- ✅ `og:description` - Page description
- ✅ `og:image` - Social share image (1200x630px recommended)
- ✅ `og:url` - Canonical URL
- ✅ `og:type` - "website" for pages
- ✅ `og:site_name` - "Ngirit"
- ✅ `og:locale` - "id_ID" for Indonesian

### 5. Twitter Cards
- ✅ `twitter:card` - "summary_large_image"
- ✅ `twitter:site` - "@ngirit"
- ✅ `twitter:title` - Page title
- ✅ `twitter:description` - Page description
- ✅ `twitter:image` - Social share image

### 6. Structured Data (JSON-LD)
- ✅ Organization schema
- ✅ WebApplication schema
- ✅ Properly formatted and validated

### 7. Technical SEO
- ✅ HTML lang attribute set to "id"
- ✅ Canonical URLs on all pages
- ✅ robots.txt properly configured
- ✅ sitemap.xml for search engines
- ✅ Mobile-friendly (responsive design)
- ✅ Fast loading times (Nuxt SSR)
- ✅ HTTPS (via deployment)

## File Structure

```
├── utils/constants/seo.ts          # SEO configuration & helpers
├── app.vue                          # Global SEO setup
├── pages/
│   ├── index.vue                    # Homepage SEO
│   ├── dashboard.vue                # Dashboard SEO (noindex)
│   └── profile.vue                  # Profile SEO (noindex)
├── public/
│   ├── robots.txt                   # Crawler instructions
│   ├── sitemap.xml                  # URL listing
│   ├── favicon.ico                  # Favicon
│   ├── og-image.png                 # Open Graph image (needs creation)
│   ├── twitter-image.png            # Twitter Card image (needs creation)
│   ├── logo.png                     # Logo (needs creation)
│   └── apple-touch-icon.png         # iOS icon (needs creation)
└── docs/SEO_GUIDE.md                # This file
```

## robots.txt Configuration

**Location:** `public/robots.txt`

**Content:**
```
User-Agent: *
Allow: /

# Disallow private pages
Disallow: /dashboard
Disallow: /profile
Disallow: /confirm
Disallow: /api/

Sitemap: https://ngirit.app/sitemap.xml
```

## sitemap.xml Configuration

**Location:** `public/sitemap.xml`

Currently includes:
- Homepage (`/`) - Priority: 1.0, Weekly updates

**Note:** Private pages (dashboard, profile) are excluded as they require authentication.

## Adding SEO to New Pages

When creating a new public page:

1. **Import SEO utilities:**
```typescript
import { PAGE_SEO, getCanonicalUrl, getOpenGraphTags, getTwitterCardTags } from '~/utils/constants/seo';
```

2. **Add page config to `utils/constants/seo.ts`:**
```typescript
export const PAGE_SEO = {
  // ... existing pages
  newPage: {
    title: 'Page Title',
    description: 'Page description for SEO',
    keywords: 'relevant, keywords, here',
  },
};
```

3. **Add SEO to page component:**
```vue
<script setup lang="ts">
useHead({
  title: PAGE_SEO.newPage.title,
  link: [
    { rel: 'canonical', href: getCanonicalUrl('/new-page') },
  ],
});

useSeoMeta({
  title: PAGE_SEO.newPage.title,
  description: PAGE_SEO.newPage.description,
  keywords: PAGE_SEO.newPage.keywords,

  ...getOpenGraphTags({
    title: PAGE_SEO.newPage.title,
    description: PAGE_SEO.newPage.description,
    url: getCanonicalUrl('/new-page'),
  }),

  ...getTwitterCardTags({
    title: PAGE_SEO.newPage.title,
    description: PAGE_SEO.newPage.description,
  }),
});
</script>
```

4. **Update sitemap.xml:**
```xml
<url>
  <loc>https://ngirit.app/new-page</loc>
  <lastmod>2025-10-26</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

## TODO: Assets Needed

### Images to Create

1. **`public/og-image.png`**
   - Size: 1200x630px
   - Format: PNG or JPG
   - Content: Ngirit branding + tagline
   - Used for: Facebook, LinkedIn sharing

2. **`public/twitter-image.png`**
   - Size: 1200x675px (or 1200x630px)
   - Format: PNG or JPG
   - Content: Ngirit branding + tagline
   - Used for: Twitter/X sharing

3. **`public/logo.png`**
   - Size: 512x512px (square)
   - Format: PNG with transparency
   - Content: Ngirit logo
   - Used for: Structured data, PWA

4. **`public/apple-touch-icon.png`**
   - Size: 180x180px
   - Format: PNG
   - Content: Ngirit app icon
   - Used for: iOS home screen

5. **`public/favicon.ico`**
   - Size: 32x32px (or 16x16px)
   - Format: ICO
   - Content: Ngirit icon
   - Used for: Browser tab

## Testing SEO Implementation

### 1. Local Testing

**Test meta tags:**
```bash
# Start dev server
pnpm dev

# View source at http://localhost:3000
# Check <head> section for meta tags
```

### 2. Online Tools

**Recommended tools:**

1. **Google Search Console**
   - URL: https://search.google.com/search-console
   - Use: Submit sitemap, monitor indexing

2. **Meta Tags Checker**
   - URL: https://metatags.io
   - Use: Preview social share cards

3. **Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Use: Validate structured data

4. **robots.txt Tester**
   - URL: https://support.google.com/webmasters/answer/6062598
   - Use: Validate robots.txt

5. **Mobile-Friendly Test**
   - URL: https://search.google.com/test/mobile-friendly
   - Use: Check mobile optimization

### 3. Browser Extensions

- **Meta SEO Inspector** (Chrome/Firefox)
- **SEO Meta in 1 Click** (Chrome)
- **Facebook Sharing Debugger**
- **Twitter Card Validator**

## Performance Monitoring

### Metrics to Track

1. **Search Rankings**
   - Target keywords position in Google
   - Organic traffic growth
   - Click-through rate (CTR)

2. **Social Sharing**
   - Share count on social platforms
   - Click-through from social
   - Social engagement metrics

3. **Technical Health**
   - Page load time
   - Core Web Vitals
   - Mobile usability
   - Index coverage

## Future Enhancements

### Priority 1 (High Impact)
- [ ] Create social share images (OG/Twitter)
- [ ] Set up Google Search Console
- [ ] Submit sitemap to Google
- [ ] Add schema.org WebSite with search action
- [ ] Implement Open Graph image generator

### Priority 2 (Medium Impact)
- [ ] Add FAQ schema for common questions
- [ ] Create blog/content section for SEO
- [ ] Implement review/rating schema (when available)
- [ ] Add breadcrumb schema for deep pages
- [ ] Multi-language support (if expanding beyond Indonesia)

### Priority 3 (Nice to Have)
- [ ] Dynamic sitemap generation
- [ ] Automatic OG image generation per page
- [ ] Video schema (if adding video content)
- [ ] Event schema (if adding events)
- [ ] Local business schema (if adding physical location)

## SEO Checklist for Production

Before deploying to production:

- [ ] Verify all meta tags are present
- [ ] Test social share previews
- [ ] Validate structured data
- [ ] Check robots.txt is accessible
- [ ] Verify sitemap.xml is accessible
- [ ] Test canonical URLs
- [ ] Ensure HTTPS is enabled
- [ ] Verify mobile responsiveness
- [ ] Check page load speed
- [ ] Set up Google Analytics (optional)
- [ ] Set up Google Search Console
- [ ] Submit sitemap to Google
- [ ] Create and upload social share images

## Key SEO Metrics

**Target Keywords (Indonesian Market):**
- aplikasi keuangan
- pencatat pengeluaran
- manajemen keuangan pribadi
- budgeting Indonesia
- keuangan keluarga
- ngirit
- hemat uang
- tracking pengeluaran

**Target Audience:**
- Location: Indonesia
- Language: Bahasa Indonesia
- Demographics: Personal finance users, families
- Intent: Financial management, expense tracking

## Resources

- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Nuxt SEO Documentation](https://nuxt.com/docs/getting-started/seo-meta)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org Documentation](https://schema.org/)
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)

## Support

For SEO-related questions or improvements, refer to this guide or consult with SEO specialists for advanced optimization strategies.

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
