<template>
  <v-app>
    <v-app-bar app="app" color="primary" dark="dark" dense="dense">
      <v-toolbar-title>Ngirit</v-toolbar-title>
      <v-spacer />
      <v-btn color="white" icon="icon" @click.prevent="signOut">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>
    <nuxt />
  </v-app>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  methods: {
    ...mapMutations({
      reset: 'auth/reset'
    }),
    signOut () {
      this.$fire.auth.signOut()
      this.reset()
      this.$router.replace('/login')
    }
  }
}
</script>
