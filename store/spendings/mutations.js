/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { updateField } from 'vuex-map-fields'
export default {
  reset(state) {
    state.dialog_create = false
    state.dialog_update = false
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
  pushToItems(state, payload) {
    state.items.push(payload)
  },
  updateField,
}
