<template lang="pug">
div.bg-gray-200.h-screen.flex.items-center.justify-center.w-full
  div.bg-white.max-w-xs.w-full.p-4.shadow
    div.bg-red-100.border.border-red-500.mb-4.rounded.p-4(v-if='error.message')
      h4.font-roboto.font-bold.text-lg Error
      p {{ error.message }}
    div.mb-4
      label.cursor-pointer.font-bold.mb-2.text-gray-700.text-sm(for='email') E-mail
      input#email(v-model.trim='email', :class='inputClasses("email")', type='email')
    div.mb-4
      label.cursor-pointer.font-bold.mb-2.text-gray-700.text-sm(for='password') Password
      input#password(v-model.trim='password', :class='inputClasses("email")', type='password')
    div.flex.items-center
      button(@click='submit', :disabled='email === "" || password === ""', :class='buttonClasses()', type='button') Sign In

</template>
<script>
import firebase from 'firebase/app'
require('firebase/auth')
export default {
  data() {
    return {
      email: '',
      error: {},
      password: ''
    }
  },
  methods: {
    buttonClasses() {
      let classes = []
      classes = [
        'bg-blue-500',
        'font-bold',
        'py-2',
        'px-4',
        'rounded',
        'text-white',
        'hover:bg-blue-700',
        'focus:outline-none',
        'focus:shadow-outline'
      ]

      if (this.email === '' || this.password === '') {
        classes.push('opacity-50')
        classes.push('cursor-not-allowed')
      } else {
        classes.push('opacity-100')
        classes.push('cursor-pointer')
      }

      return classes
    },
    inputClasses(input) {
      let classes = []
      classes = [
        'shadow',
        'appearance-none',
        'border',
        'rounded',
        'w-full',
        'py-2',
        'px-3',
        'text-gray-700',
        'leading-tight',
        'focus:outline-none',
        'focus:shadow-outline'
      ]

      return classes
    },
    submit() {
      this.error = {}
      firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then((user) => {
          this.$router.replace('/')
        })
        .catch((error) => {
          // Handle Errors here.
          this.error = {
            code: error.code,
            message: error.message
          }
        })
    }
  }
}
</script>
