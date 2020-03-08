/* eslint-disable space-before-function-paren */
export default {
  filters: {
    digitGrouping(num) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    }
  }
}
