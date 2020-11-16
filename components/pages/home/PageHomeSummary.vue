<template>
  <v-card tile>
    <v-card-title>Pengeluaran</v-card-title>
    <v-divider />
    <v-card-text>
      <v-list-item v-if="todaysSpendings">
        <v-list-item-content>
          <v-list-item-title>Hari Ini</v-list-item-title>
        </v-list-item-content><span class="block text-right">Rp {{ todaysSpendings | digitGrouping }}</span>
      </v-list-item>
      <v-list-item v-if="thisMonthSpendings">
        <v-list-item-content>
          <v-list-item-title>Bulan Ini</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <span class="block text-right">Rp {{ thisMonthSpendings | digitGrouping }}</span>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>
<script>
import getUnixTime from 'date-fns/getUnixTime'
import startOfToday from 'date-fns/startOfToday'
export default {
  name: 'PageHomeSummary',
  props: {
    items: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    thisMonthSpendings () {
      if (this.items.length <= 0) { return }
      const items = [...this.items]
      return items.reduce((sum, ob) => {
        return sum + ob.value
      }, 0)
    },
    todaysItems () {
      if (this.items.length <= 0) { return }
      const items = [...this.items]
      const now = new Date()
      const start = getUnixTime(startOfToday(now))

      return items
        .filter(ob => ob.createdAt >= start)
        .sort((a, b) => {
          return b.createdAt - a.createdAt
        })
    },
    todaysSpendings () {
      if (this.items.length <= 0) { return 0 }
      return this.todaysItems.reduce((sum, ob) => {
        return sum + ob.value
      }, 0)
    }
  }
}
</script>
