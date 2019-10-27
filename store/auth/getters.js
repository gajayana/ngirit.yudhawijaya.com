/* eslint-disable space-before-function-paren */
export default {
  activeUser(state, getters) {
    return state.user
  },
  isProcessing(state, getters) {
    return state.is_processing
  }
}
