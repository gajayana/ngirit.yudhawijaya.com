/* eslint-disable space-before-function-paren */
import { updateField } from 'vuex-map-fields'
export default {
  reset(state) {
    state.dialog_create = false
    state.error = ''
    state.form_item = ''
    state.form_value = ''
    state.is_processing = false
  },
  setError(state, payload) {
    state.error = payload
  },
  setIsProcessing(state, payload) {
    state.is_processing = payload
  },
  updateField
}
