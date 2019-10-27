<template lang="pug">
v-app
  v-content
    v-container.fill-height(fluid)
      v-row(align='center', justify='center')
        v-col(cols='12', sm='8', md='5')
          v-card.elevation-12
            v-toolbar(color='primary', dark, flat)
              v-toolbar-title Catat Masuk
            v-card-text
              v-form
                v-text-field(v-model='email', :autofocus='true', :disabled='is_processing', label='Email', name='email', type='text')
                v-text-field(v-model='password', :disabled='is_processing', label='Sandi', name='password', type='password')
            v-card-actions
              v-spacer
              v-btn(@click='submit', :disabled='is_processing', :loading='is_processing', color='primary') Masuk

</template>
<script>
/* eslint-disable space-before-function-paren */
import { mapActions, mapGetters } from 'vuex'
export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  middleware: 'authenticated',
  computed: {
    ...mapGetters({
      is_processing: 'auth/isProcessing'
    })
  },
  methods: {
    ...mapActions({
      signIn: 'auth/signIn'
    }),
    submit() {
      this.signIn({
        email: this.email,
        password: this.password
      })
    }
  }
}
</script>
