<template lang="pug">
v-form
  v-card(flat, :style='{ height: "100vh" }')
    v-toolbar(color='primary', dark)
      v-btn(dark, icon, @click='dialog_create = false')
        v-icon mdi-close
      v-toolbar-title Tambah Entri
    v-container
      v-col.mx-2
        v-text-field(v-model.trim='form_item', :disabled='is_processing', label='Barang/Jasa', type='text')
        v-text-field(v-model.trim='form_value', :disabled='is_processing', label='Harga', type='number')
    v-card-actions
      v-spacer
      v-btn(@click.prevent='submit', :loading='is_processing', color='primary', dark) Kirim
</template>
<script>
/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { createHelpers } from 'vuex-map-fields'
import { mapActions, mapState } from 'vuex'

const { mapFields } = createHelpers({
  getterType: 'spendings/getField',
  mutationType: 'spendings/updateField',
})

export default {
  props: {
    intent: {
      type: String,
      default: 'create',
    },
  },
  computed: {
    ...mapFields(['dialog_create', 'form_item', 'form_value']),
    ...mapState({
      is_processing: (state) => {
        return state.spendings.is_processing
      },
      user: (state) => {
        return state.auth.user
      },
    }),
  },
  methods: {
    ...mapActions({
      createSpending: 'spendings/create',
    }),
    submit() {
      if (this.is_processing) {
        return
      }

      if (this.intent === 'create') {
        this.createSpending(this.user)
      }
    },
  },
}
</script>
