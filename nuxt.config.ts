// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@nuxt/scripts',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      exclude: ['/'],
    },
    types: '~/utils/constants/database.ts',
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY,
  },

  runtimeConfig: {
    // Private keys that are only available on the server
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,

    // Public keys that are available on both client and server
    public: {
      host: process.env.NUXT_PUBLIC_HOST,
      SUPABASE_KEY: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    },
  },
});
