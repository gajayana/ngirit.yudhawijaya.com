<template lang="pug">
div.fill-height
  v-content.fill-height
    v-container.grey.lighten-4.fill-height(fluid)
      v-col(v-if='is_loading')
        v-sheet.mb-4
          div.pa-4
            v-skeleton-loader.mb-2(type='heading')
            v-skeleton-loader(type='text')
          div.pa-4
            v-skeleton-loader.mb-2(type='heading')
            v-skeleton-loader(type='text')
        v-sheet.mb-4
          v-container
            v-row(v-for='i in 5', :key='i')
              v-col(cols='8')
                v-skeleton-loader(type='text@2')
              v-col(cols='4')
                v-skeleton-loader(type='text')

      v-col(v-else, no-gutters)
        v-card.mb-4
          v-card-title Pengeluaran
          v-list-item(v-if='todaysSpendings')
            v-list-item-content
              v-list-item-title Hari Ini
            span.block.text-right Rp {{ todaysSpendings | digitGrouping }}
          v-list-item(v-if='thisMonthSpendings')
            v-list-item-content
              v-list-item-title Bulan Ini
            span.block.text-right Rp {{ thisMonthSpendings | digitGrouping }}
        v-card
          v-card-title Rincian
          v-list-item(v-for='item in todaysItems', :key='item.id')
            v-list-item-content
              v-list-item-title {{ item.label }}
              v-list-item-subtitle {{ item.created_at | dtFormatHour }}
            v-list-item-content
              span.block.text-right Rp {{ item.value | digitGrouping }}
  v-dialog(v-model='dialog_create', fullscreen, hide-overlay, transition='dialog-bottom-transition')
    template(v-slot:activator='{ on }')
      v-btn(v-on='on', bottom, color='pink', dark, fab, fixed, right)
        v-icon mdi-plus
    spending-form(intent='create')
  //- v-dialog(v-model='dialog_create', fullscreen, hide-overlay, transition='dialog-bottom-transition')
    spending-form(intent='update')

</template>

<script>
/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import digitGrouping from '~/mixins/filters/digitGrouping'
import dtFormatHour from '~/mixins/filters/dtFormatHour'
import SpendingForm from '~/components/spendings/form'

const { mapFields } = createHelpers({
  getterType: 'spendings/getField',
  mutationType: 'spendings/updateField',
})

export default {
  components: {
    SpendingForm,
  },
  mixins: [digitGrouping, dtFormatHour],
  asyncData({
    isDev,
    route,
    store,
    env,
    params,
    query,
    req,
    res,
    redirect,
    error,
  }) {
    store.dispatch('spendings/fetch')
  },
  layout: 'dashboard',
  middleware: 'authenticated',
  computed: {
    ...mapFields(['dialog_create', 'dialog_update']),
    ...mapGetters({
      thisMonthSpendings: 'spendings/thisMonthSpendings',
      todaysItems: 'spendings/todaysItems',
      todaysSpendings: 'spendings/todaysSpendings',
    }),
    ...mapState({
      is_loading: (state) => {
        return state.spendings.is_loading
      },
      items: (state) => {
        return state.spendings.items
      },
    }),
  },
}
</script>
