<template>
  <v-snackbar v-model="show" :timeout="timeout">
    Ada pembaruan konten
    <template #action="{ attrs }">
      <v-btn
        color="blue"
        text
        v-bind="attrs"
        @click="reload"
      >
        Muat Ulang
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script>
export default {
  data: () => ({
    show: false,
    timeout: 60000
  }),
  mounted () {
    this.$nextTick(async () => {
      const workbox = await window.$workbox
      if (workbox) {
        workbox.addEventListener('installed', (event) => {
          // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
          if (event.isUpdate) {
            // whatever logic you want to use to notify the user that they need to refresh the page.
            this.show = true
          }
        })
      }
    })
  },
  methods: {
    reload () {
      this.show = false
      window.location.reload(true)
    }
  }
}
</script>
