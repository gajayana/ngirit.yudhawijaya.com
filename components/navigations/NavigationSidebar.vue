<template>
  <div>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="title">
          Ngirit
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider />
    <v-list dense nav>
      <v-list-item v-for="(item, key) in menuItems" :key="`menu-sidebar-${key}`" nuxt :to="item.to">
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link @click.prevent="signOut">
        <v-list-item-icon>
          <v-icon>mdi-logout</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Keluar</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'NavigationSidebar',
  computed: {
    menuItems () {
      // const now = new Date()
      const res = [
        {
          icon: 'mdi-view-dashboard',
          label: 'Dasbor',
          to: '/'
        }
      ]

      return res
    }
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
