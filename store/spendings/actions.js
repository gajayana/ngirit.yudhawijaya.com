/* eslint-disable space-before-function-paren */
import { StoreDB } from '~/services/fireinit.js'
export default {
  create({ commit, state }, user) {
    commit('setIsProcessing', true)
    const collection =
      process.env.NODE_ENV === 'development' ? 'dev-spendings' : 'spendings'
    const dt = new Date()
    StoreDB.collection(collection)
      .add({
        label: state.form_item,
        value: parseFloat(state.form_value),
        user: user.uid,
        created_at: dt.getTime()
      })
      .then(() => {
        commit('reset', false)
      })
      .catch((err) => {
        commit('setError', { location: 'form', message: err })
      })
  },
  fetch({ commit }) {
    const collection =
      process.env.NODE_ENV === 'development' ? 'dev-spendings' : 'spendings'
    StoreDB.collection(collection)
      .doc()
      .onSnapshot((item) => {
        console.log(item)
      })
    // .catch((err) => {
    //   commit('setError', { location: 'list', message: err })
    // })

    // console.log(doc)
  }
}
