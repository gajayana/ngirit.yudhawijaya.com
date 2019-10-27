<template lang="pug">
 v-app
  div ini halaman terlindungi
  button(@click='signOut') keluwar
</template>

<script>
/* eslint-disable space-before-function-paren */
import { mapActions } from 'vuex'
export default {
  asyncData({
    isDev,
    route,
    store,
    env,
    params,
    query,
    req,
    res,
    redirect,
    error
  }) {},
  middleware: 'authenticated',
  // data() {
  //   return {
  //     user: '',
  //     users: []
  //   }
  // },
  methods: {
    ...mapActions({
      signOut: 'auth/signOut'
    }),
    logout() {
      this.$store.commit('SIGN_USER_OUT')
    }
  }
}
</script>
