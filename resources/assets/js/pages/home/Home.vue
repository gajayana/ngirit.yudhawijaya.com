<template lang="pug">
v-app
  v-toolbar(app, color='primary', dark)
    v-toolbar-side-icon
    v-toolbar-title Ngirit
  v-content
    v-container(fluid)
      v-layout
        v-flex(sm-12)
          v-card.mb-4
            v-card-title 
              h1.headline Pengeluaran
            v-card-text
              div
                span.mr-1 Hari ini:
                span.red--text Rp 999.999
              div
                span.mr-1 Bulan ini:
                span.green--text Rp 9.999.999
          v-card
            v-list(two-line, subheader)
              v-subheader(inset) Rekap 09 Agustus 2017
              v-divider(inset)
              v-list-tile(avatar)
                v-list-tile-avatar(color='red')
                  span.white--text.headline J
                v-list-tile-content
                  v-list-tile-title Mangan
                  v-list-tile-sub-title Rp 99.999.999
  v-dialog(v-model='dialog_create', fullscreen, hide-overlay, persistent, ransition='dialog-bottom-transition')
    v-btn(color='primary', dark, fab, fixed, bottom, right, slot='activator')
      v-icon add
    v-card
      v-toolbar(color='primary', dark)
        v-btn(@click='dialog_create = !dialog_create', dark, icon)
          v-icon close
        v-toolbar-title Tambah
      v-card-text
        v-form
          v-text-field(label='Nama Barang/Jasa/Tindakan', type='text')
          v-text-field(label='Harga', type='number')
      v-card-actions
        v-spacer
        v-btn(color='primary') Simpan
</template>

<script scoped>
import { mapState } from 'vuex';
export default {
  name: 'Home',
  data() {
    return {
      dialog_create: false,
    }
  },
  computed: {
    ...mapState({
      user: state => state.user,
    })
  },
  mounted() {
    
  }
}
</script>
