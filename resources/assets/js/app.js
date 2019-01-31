
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

// require('./bootstrap')
import 'babel-polyfill'
// Axios
window.axios = require('axios');
// Vue
import Vue from 'vue'
// Router
import VueRouter from 'vue-router'
// Vuetify
import Vuetify, {
  VAlert,
  VApp,
  VBtn,
  VCard,
  VCardActions,
  VCardText,
  VCardTitle,
  VContainer,
  VContent,
  VDialog,
  VDivider,
  VFlex,
  VForm,
  VIcon,
  VLayout,
  VList,
  VListTile,
  VListTileAvatar,
  VListTileContent,
  VListTileSubTitle,
  VListTileTitle,
  VSpacer,
  VSubheader,
  VTextField,
  VToolbar,
  VToolbarItems,
  VToolbarSideIcon,
  VToolbarTitle,
} from 'vuetify/lib'
// Vuex
import Vuex from 'vuex';

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
let token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
  console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

Vue.use(Vuetify, {
  components: {
    VAlert,
    VApp,
    VBtn,
    VCard,
    VCardActions,
    VCardText,
    VCardTitle,
    VContainer,
    VContent,
    VDialog,
    VDivider,
    VFlex,
    VForm,
    VIcon,
    VLayout,
    VList,
    VListTile,
    VListTileAvatar,
    VListTileContent,
    VListTileSubTitle,
    VListTileTitle,
    VSpacer,
    VSubheader,
    VTextField,
    VToolbar,
    VToolbarItems,
    VToolbarSideIcon,
    VToolbarTitle,
  }
})
Vue.use(VueRouter)
Vue.use(Vuex)

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

// Vue.component('example-component', require('./components/ExampleComponent.vue'));
import Home from './pages/home/Home.vue'
import Login from './pages/auth/Login.vue'

const routes = [
  {
    path: '/',
    component: Home,
    beforeEnter(to, from, next) {
      if (!window.Ngirit) {
        next('/catat_masuk')
      } else {
        next()
      }
    }
  },
  {
    path: '/catat_masuk',
    component: Login,
  }
  // {
  //     path: '/cari',
  //     component: Search
  // },
  // {
  //     path: '/dasbor',
  //     component: Dashboard
  // }
]
const router = new VueRouter({
  routes,
  // mode: 'history',
})

const store = new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    updateState(state, payload) {
      state.user = payload.user
    }
  },
  actions: {
    stateInit(context) {
      let promises = [
        axios.get('/api/pengguna/' + window.Ngirit.uuid),
      ];
      axios
        .all(promises)
        .then( ( [ { data : user} ] ) => {
          context.commit(
            'updateState',
            {
              user: user,
            }
          )
        } )
        .catch(error => console.log(error))
    }
  }
})

if (window.Ngirit) store.dispatch('stateInit')

const app = new Vue({
  el: '#ngirit',
  router,
  store
})
