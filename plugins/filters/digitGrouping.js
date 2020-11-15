import Vue from 'vue'
Vue.filter('digitGrouping', (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
})
