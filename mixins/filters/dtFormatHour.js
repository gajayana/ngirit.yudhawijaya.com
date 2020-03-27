/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
export default {
  filters: {
    dtFormatHour(ts) {
      return format(fromUnixTime(ts), 'HH:mm')
    },
  },
}
