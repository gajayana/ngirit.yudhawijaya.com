/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
export default {
  filters: {
    digitGrouping(num) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    },
  },
}
