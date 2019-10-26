<template lang="pug">
  div.container.mx-auto
    div.mb-4 {{ user }}
    div.flex.justify-center
      button(@click='logout') Logout
</template>

<script>
// import { db } from '~/plugins/firebase.js'
export default {
  data() {
    return {
      user: '',
      users: []
    }
  },
  methods: {
    logout() {
      this.$store.commit('SIGN_USER_OUT')
    }
  }
}
</script>
