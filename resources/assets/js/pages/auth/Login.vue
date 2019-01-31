<template lang="pug">
v-app
  v-content
    v-container(fill-height)
      v-layout(align-center, fill-height, justify-center, row)
        v-flex(xs12)
          v-alert(v-if='is_successful', :value='true', type='success') Catat masuk berhasil. Mengarahkan ke dasbor.
          v-card(v-else)
            v-card-title
              h1 Catat Masuk
            v-card-text
              v-text-field(v-model='email', :autofocus='true', :disabled='is_processing', :error='emailHasError', :error-messages='errors && errors.email ? errors.email : null', label='Email', type='email')
              v-text-field(v-model='password', :disabled='is_processing', :error='passwordHasError', :error-messages='errors && errors.password ? errors.password : null', label='Password', type='password')
            v-card-actions
              v-spacer
              v-btn(@click='submit', :loading='is_processing', color='primary', dark) Login
</template>
<script>
export default {
  name: 'Login',
  data() {
    return {
      email: '',
      errors: null,
      is_processing: false,
      is_successful: false,
      password: '',
    }
  },
  computed: {
    emailHasError() {
      return this.errors && this.errors.hasOwnProperty('email');
    },
    passwordHasError() {
      return this.errors && this.errors.hasOwnProperty('password');
    }
  },
  methods: {
    submit() {
      const args = {
        email: this.email.trim(),
        password: this.password.trim(),
        remember: true,
      }
      this.is_processing = true
      axios
        .post('/catat_masuk', args)
        .then(({data}) => {
          this.is_processing = false
          if (data.status === 'error') {
            this.errors = data.messages
          }
          if (data.status === 'success') {
            this.is_successful = true
            window.location.href = '/'
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>
