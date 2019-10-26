import firebase from 'firebase/app'
require('firebase/auth')

export const state = () => ({
  user: null
})

export const getters = {
  getUser(state) {
    return state.user
  }
}

export const mutations = {
  FETCH_USER(state, payload) {
    state.user = payload.slice()
  },
  SIGN_USER_OUT(state, payload) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        this.$router.replace('/login')
      })
  }
}

export const actions = {
  fetchUser(context) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        context.commit('FETCH_USER', user)
      } else {
        context.commit('FETCH_USER', null)
      }
    })
  }
}
