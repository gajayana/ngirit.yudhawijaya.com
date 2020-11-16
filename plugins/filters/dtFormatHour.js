import Vue from 'vue'
import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'

Vue.filter('dtFormatHour', ts => format(fromUnixTime(ts), 'HH:mm'))
