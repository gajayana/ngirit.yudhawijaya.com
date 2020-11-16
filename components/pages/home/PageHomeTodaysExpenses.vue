<template>
  <v-card tile>
    <v-card-title>Rincian Hari Ini</v-card-title>
    <v-divider />
    <v-card-text>
      <v-list-item v-for="item in todaysItems" :key="item.id" dense>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.createdAt | dtFormatHour }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-content>
          <span class="subtitle-2 text-right">Rp {{ item.value | digitGrouping }}</span>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>
<script>
import getUnixTime from 'date-fns/getUnixTime'
import startOfToday from 'date-fns/startOfToday'
export default {
  name: 'PageHomeTodaysExpenses',
  props: {
    items: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
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
    }
  }
}
</script>
