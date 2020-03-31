/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
import { getField } from 'vuex-map-fields'
import format from 'date-fns/format'
import getUnixTime from 'date-fns/getUnixTime'

export default {
  getField,
  thisMonthsSpendings(state) {
    if (!state.items) {
      return
    }

    return state.items.reduce((sum, ob) => {
      return sum + ob.value
    }, 0)
  },
  todaysItems(state) {
    if (!state.items.length) {
      return
    }

    const dt = new Date()
    const { year, month, day } = {
      year: format(dt, 'yyyy'),
      month: format(dt, 'M') - 1,
      day: format(dt, 'd'),
    }
    const { start, end } = {
      start: getUnixTime(new Date(year, month, day, 0, 0, 0)),
      end: getUnixTime(new Date(year, month, day, 23, 59, 59)),
    }

    return state.items
      .filter((ob) => {
        return ob.created_at >= start && ob.created_at <= end
      })
      .sort((a, b) => {
        return b.created_at - a.created_at
      })
  },
  todaysSpendings(state, getters) {
    if (!getters.todaysItems) {
      return
    }

    return getters.todaysItems.reduce((sum, ob) => {
      return sum + ob.value
    }, 0)
  },
}
