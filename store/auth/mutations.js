/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { updateField } from 'vuex-map-fields'
export default {
  reset(state) {
    state.email = ''
    state.errors = ''
    state.is_processing = false
    state.password = ''
    state.user = ''
  },
  setErrors(state, payload) {
    state.errors = payload
  },
  setIsProcessing(state, payload) {
    state.is_processing = payload
  },
  setUser(state, payload) {
    state.user = payload
  },
  updateField,
}
