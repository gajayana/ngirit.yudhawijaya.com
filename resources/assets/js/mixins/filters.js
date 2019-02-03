export default {
  filters: {
    dateFormal( str ) {
      if (!str) return
      const d = new Date( str )
      const months = [ '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember' ]
      return d.getDate() + ' ' + months[d.getMonth() + 1] + ' ' + d.getFullYear()
    },
    digitGrouping( num ) {
      if (!num) return
      let str = num.toString()
      if (str.length >= 4) str = str.replace(/(\d)(?=(\d{3})+$)/g, '$1.')
      return str
    },
    firstLetterOnly( str ) {
      if (!str) return
      return str.charAt(0)
    },
    hourOnly(str) {
      if (!str) return
      const d = new Date(str)
      const hour = d.getHours() < 10 ? '0' + d.getHours() : d.getHours()
      const minute = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()
      return hour + ':' + minute
    }
  }
}