/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { getField } from 'vuex-map-fields'
export default {
  getField,
  isProcessing(state, getters) {
    return state.is_processing
  },
}
