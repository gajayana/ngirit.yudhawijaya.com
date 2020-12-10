<template>
  <v-main>
    <v-container>
      <v-row v-if="isLoading">
        <v-col cols="12" sm="6" offset-sm="3">
          <v-card class="mb-4 pa-4">
            <v-skeleton-loader type="heading, list-item@2" />
          </v-card>
          <v-card class="pa-4">
            <v-skeleton-loader type="heading, list-item@5" />
          </v-card>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12" sm="6" offset-sm="3">
          <page-home-summary :items="items" class="mb-6" />
          <page-home-todays-expenses :items="items" class="mb-6" />
          <page-home-month-chart :items="items" />
        </v-col>
      </v-row>
      <page-home-form-create />
    </v-container>
  </v-main>
</template>

<script>
// import consola from 'consola'
import getUnixTime from 'date-fns/getUnixTime'
import startOfMonth from 'date-fns/startOfMonth'
export default {
  name: 'PageHome',
  middleware: 'authenticated',
  data: () => ({
    isLoading: true,
    items: []
  }),
  fetch () {
    const { nodeEnv } = this.$config
    const collection = nodeEnv === 'development' ? 'dev-spendings' : 'spendings'
    const now = new Date()
    const start = getUnixTime(startOfMonth(now))

    this.$fire
      .firestore
      .collection(collection)
      .where('created_at', '>=', start)
      .orderBy('created_at', 'desc')
      .onSnapshot((snapshot) => {
        this.isLoading = false
        snapshot
          .docChanges()
          .forEach((change) => {
            if (change.type === 'added') {
              const {
                created_at: createdAt,
                label,
                user,
                value
              } = change.doc.data()
              const index = this.items.findIndex(ob => ob.id === change.doc.id)

              if (index < 0) {
                this.items.push({
                  createdAt,
                  id: change.doc.id,
                  label,
                  user,
                  value
                })
              }
            }
          })
      })
  },
  head () {
    return {
      title: 'Muka'
    }
  }
}
</script>
