/* eslint-disable space-before-function-paren */
import { auth } from '~/services/fireinit.js'
export default {
  signIn({ commit, state }) {
    commit('setIsProcessing', true)
    auth
      .signInWithEmailAndPassword(state.email, state.password)
      .then((res) => {
        // console.log(user)
        commit('setUser', { uid: res.user.uid, email: res.user.email })
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
  async signOut({ commit }) {
    try {
      await auth.signOut()
      commit('setUser', '')
      this.$router.replace('/login')
    } catch (error) {
      commit('setErrors', {
        code: error.code,
        message: error.message
      })
    }
  }
}
