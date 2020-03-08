/* eslint-disable space-before-function-paren */
import { auth } from '~/services/fireinit.js'
export default {
  signIn({ commit, state }) {
    commit('setIsProcessing', true)
    auth
      .signInWithEmailAndPassword(state.email, state.password)
      .then((user) => {
        commit('setUser', user)
        commit('reset')
        this.$router.replace('/')
      })
      .catch((error) => {
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
