<template lang="pug">
v-app
  v-content
    v-container.fill-height(fluid)
      v-row(align='center', justify='center')
        v-col(cols='12', sm='8', md='5')
          v-form
            v-card.elevation-12
              v-toolbar(color='primary', dark, flat)
                v-toolbar-title Catat Masuk
              v-card-text
                v-text-field(v-model.trim='email', :autofocus='true', :disabled='is_processing', label='Email', name='email', type='text')
                v-text-field(v-model.trim='password', :disabled='is_processing', label='Sandi', name='password', type='password')
              div.col-12(v-if='errors', :style='{ paddingBottom: 0, paddingTop: 0 }')
                v-alert(:style='{ marginBottom: 0 }', dense, type='error') {{ errors.message }}
              v-card-actions
                v-spacer
                v-btn(@click='signIn', :disabled='is_processing', :loading='is_processing', color='primary') Masuk

</template>
<script>
/* eslint-disable space-before-function-paren */
import { mapActions, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'

const { mapFields } = createHelpers({
  getterType: 'auth/getField',
  mutationType: 'auth/updateField'
})

export default {
  middleware: 'authenticated',
  computed: {
    ...mapState({
      errors: (state) => {
        return state.auth.errors
      },
      is_processing: (state) => {
        return state.auth.isProcessing
      }
    }),
    ...mapFields(['email', 'password'])
  },
  methods: {
    ...mapActions({
      signIn: 'auth/signIn'
    })
  }
}
</script>
