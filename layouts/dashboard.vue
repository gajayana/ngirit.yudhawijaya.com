<template lang="pug">
v-app
  v-app-bar(app, color='primary', dark, dense)
    v-toolbar-title Ngirit
    v-spacer
    v-btn(@click.prevent='signOut', color='white', icon)
      v-icon mdi-logout
  nuxt

</template>
<script>
/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { mapActions } from 'vuex'
export default {
  methods: {
    ...mapActions({
      signOut: 'auth/signOut',
    }),
  },
}
</script>
