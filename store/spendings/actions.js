/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { StoreDB } from '~/services/fireinit.js'
export default {
  async create({ commit, state }, user) {
    commit('setIsProcessing', true)
    const collection =
      process.env.NODE_ENV === 'development' ? 'dev-spendings' : 'spendings'
    const ts = Math.round(new Date().getTime() / 1000)

    try {
      await StoreDB.collection(collection).add({
        label: state.form_item,
        value: parseFloat(state.form_value),
        user: user.uid,
        created_at: ts,
        updated_at: ts,
      })
      commit('reset', false)
    } catch (error) {
      commit('setIsProcessing', false)
      commit('setError', { location: 'form', message: error })
    }
  },
  async fetch({ commit, state }) {
    const collection =
      process.env.NODE_ENV === 'development' ? 'dev-spendings' : 'spendings'
    await StoreDB.collection(collection)
      .orderBy('created_at', 'desc')
      .onSnapshot((snapshot) => {
        commit('setIsLoading', false)
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const item = change.doc.data()
            const index = state.items.findIndex((ob) => {
              return ob.id === change.doc.id
            })

            if (index < 0) {
              commit('pushToItems', {
                created_at: item.created_at,
                id: change.doc.id,
                label: item.label,
                user: item.user,
                value: item.value,
              })
            }
          }
        })
      })
  },
}
