<script setup lang="ts">
  import { SEO_CONFIG, getOrganizationSchema, getWebApplicationSchema } from '~/utils/constants/seo';

  // Global SEO configuration
  useHead({
    htmlAttrs: {
      lang: 'id',
    },
    titleTemplate: (titleChunk) => {
      return titleChunk ? `${titleChunk} | ${SEO_CONFIG.siteName}` : SEO_CONFIG.defaultTitle;
    },
    link: [
      { rel: 'icon', type: 'image/x-icon', href: SEO_CONFIG.favicon },
      { rel: 'apple-touch-icon', href: SEO_CONFIG.appleTouchIcon },
    ],
    script: [
      // Organization structured data
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(getOrganizationSchema()),
      },
      // WebApplication structured data
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(getWebApplicationSchema()),
      },
    ],
  });

  // Global SEO meta tags
  useSeoMeta({
    description: SEO_CONFIG.defaultDescription,
    keywords: SEO_CONFIG.defaultKeywords,
    author: SEO_CONFIG.siteName,
    viewport: 'width=device-width, initial-scale=1',

    // Open Graph
    ogSiteName: SEO_CONFIG.siteName,
    ogLocale: SEO_CONFIG.defaultLocale,
    ogType: 'website',

    // Twitter
    twitterCard: 'summary_large_image',
    twitterSite: SEO_CONFIG.twitterHandle,
  });
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <PageHeader />
    <main class="flex flex-col min-h-screen w-full">
      <NuxtPage />
    </main>
  </UApp>
</template>
