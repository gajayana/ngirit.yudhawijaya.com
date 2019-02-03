<template lang="pug">
v-card
  v-toolbar(color='primary', dark)
    v-btn(@click='close', dark, icon)
      v-icon close
    v-toolbar-title Tambah
  v-card-text
    v-form
      v-text-field(v-model='form.label', :autofocus='true', :error-messages='errors && errors.label ? errors.label : null', label='Nama Barang/Jasa/Tindakan', type='text')
      v-text-field(v-model='form.amount', :error-messages='errors && errors.amount ? errors.amount : null', label='Harga', type='number')
  v-card-actions
    v-spacer
    v-btn(@click='create', :loading='is_processing', color='primary') Simpan
</template>
<script>
export default {
  name: 'AppForm',
  data() {
    return {
      errors: null,
      is_processing: false
    }
  },
  props: ['form'],
  methods: {
    close() {
      this.$emit('closed')
    },
    create() {
      const args = {
        amount: this.form.amount,
        label: this.form.label,
        user: this.form.user,
      }
      this.is_processing = true

      if (this.form.intent === 'create') {
        axios
          .post('/api/pengeluaran', args)
          .then( ( { data } ) => {
            this.is_processing = false
            if ( data.hasOwnProperty('status') && data.status === 'error' ) {
              this.errors = data.messages
            } else {
              this.$emit('created', data)
            }
          } )
          .catch(error => console.log(error))
      }
    }
  }
}
</script>
