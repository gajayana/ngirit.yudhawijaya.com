<template lang="pug">
div
  v-content
    v-container.grey.lighten-4.fill-height(fluid)
      v-row(align='center', justify='center')
        div something cool is in progress

  v-dialog(v-model='dialog_create', fullscreen, hide-overlay, transition='dialog-bottom-transition')
    template(v-slot:activator='{ on }')
      v-btn(v-on='on', bottom, color='pink', dark, fab, fixed, right)
        v-icon mdi-plus
    spending-form(intent='create')
</template>

<script>
/* eslint-disable space-before-function-paren */
// import { mapActions } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import SpendingForm from '~/components/spendings/form'

const { mapFields } = createHelpers({
  getterType: 'spendings/getField',
  mutationType: 'spendings/updateField'
})

export default {
  components: {
    SpendingForm
  },
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
    error
  }) {
    store.dispatch('spendings/fetch')
  },
  layout: 'dashboard',
  middleware: 'authenticated',
  computed: {
    ...mapFields(['dialog_create'])
  }
}
</script>
