<template>
  <v-card tile>
    <v-card-title>Rincian Bulan Ini</v-card-title>
    <v-divider />
    <v-card-text>
      <v-list-item v-for="item in breakdown" :key="item.label" dense>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <span class="subtitle-2 text-right">Rp {{ item.sum | digitGrouping }}</span>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>
<script>
export default {
  name: 'PageHomeMonthChart',
  props: {
    items: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    breakdown () {
      const items = [...this.items]
      const purchases = [...new Set(items.map(ob => ob.label))]
      return purchases
        .map((ob) => {
          const sum = items
            .filter(el => el.label === ob)
            .reduce((s, el) => {
              return s + el.value
            }, 0)
          return {
            label: ob,
            sum
          }
        })
        .sort((a, b) => {
          return b.sum - a.sum
        })
    }
  }
}
</script>
