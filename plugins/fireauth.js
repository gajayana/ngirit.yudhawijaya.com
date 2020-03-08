import { auth } from '~/services/fireinit.js'

export default (context) => {
  const { store } = context

  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        store.commit('auth/setUser', { uid: user.uid, email: user.email })
      }
      resolve()
    })
  })
}
