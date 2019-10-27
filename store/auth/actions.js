/* eslint-disable space-before-function-paren */
import { auth } from '~/services/fireinit.js'
export default {
  signIn({ commit }, payload) {
    commit('setIsProcessing', true)
    auth
      .signInWithEmailAndPassword(payload.email, payload.password)
      .then((user) => {
        commit('setUser', user)
        commit('setIsProcessing', false)
        this.$router.replace('/')
      })
      .catch((error) => {
        // Handle Errors here.
        commit('setIsProcessing', false)
        commit('setErrors', {
          code: error.code,
          message: error.message
        })
      })
  },
  signOut({ commit }, payload) {
    auth
      .signOut()
      .then(() => {
        commit('setUser', null)
        this.$router.replace('/login')
      })
      .catch((error) => {
        commit('setErrors', {
          code: error.code,
          message: error.message
        })
      })
  }
}
