export default {
  ssr: false,
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: '%s - Ngirit',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '~/plugins/filters/digitGrouping',
    '~/plugins/filters/dtFormatHour'
  ],
  /*
   ** Nuxt.js modules
   */
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://github.com/nuxt-community/vuetify-module
    '@nuxtjs/vuetify'
  ],

  modules: [
    [
      '@nuxtjs/firebase',
      {
        config: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          databaseURL: process.env.FIREBASE_DATABASE_URL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
          measurementId: ''
        },
        services: {
          auth: {
            initialize: {
              onAuthStateChangedMutation: 'auth/onAuthStateChanged',
              subscribeManually: false
            },
            ssr: false
          },
          firestore: true
        }
      }
    ],
    // https://pwa.nuxtjs.org/
    '@nuxtjs/pwa'
  ],

  pwa: {
    icon: {
      source: './static/icon.png'
    },
    manifest: {
      name: 'Ngirit',
      short_name: 'Ngirit',
      theme_color: '#0D47A1'
    },
    workbox: {
      importScripts: [
        // ...
        '/firebase-auth-sw.js'
      ]
    }
  },

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  telemetry: false,

  publicRuntimeConfig: {
    nodeEnv: process.env.NODE_ENV
  }
}
