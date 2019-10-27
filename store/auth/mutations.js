/* eslint-disable space-before-function-paren */
export default {
  setErrors(state, payload) {
    state.errors = payload
  },
  setIsProcessing(state, payload) {
    state.is_processing = payload
  },
  setUser(state, payload) {
    state.user = payload
  }
}
