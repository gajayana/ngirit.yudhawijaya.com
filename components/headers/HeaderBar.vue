<template>
  <v-app-bar v-if="user" app color="primary" dark dense>
    <v-toolbar-title>Ngirit</v-toolbar-title>
    <v-spacer />
    <v-btn color="white" icon="icon" @click.prevent="signOut">
      <v-icon>mdi-logout</v-icon>
    </v-btn>
  </v-app-bar>
</template>
<script>
import { mapMutations, mapState } from 'vuex'
export default {
  name: 'HeaderBar',
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
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
