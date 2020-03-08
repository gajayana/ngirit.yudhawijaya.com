/* eslint-disable space-before-function-paren */
import { getField } from 'vuex-map-fields'
export default {
  activeUser(state, getters) {
    return state.user
  },
  getField,
  isProcessing(state, getters) {
    return state.is_processing
  }
}
