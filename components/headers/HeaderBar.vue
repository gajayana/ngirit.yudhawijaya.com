<template>
  <div>
    <v-app-bar v-if="user" app color="primary" dark dense>
      <v-toolbar-title>Ngirit</v-toolbar-title>
      <v-spacer />
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <navigation-sidebar />
    </v-navigation-drawer>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'HeaderBar',
  data: () => ({
    drawer: false
  }),
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  }
}
</script>
