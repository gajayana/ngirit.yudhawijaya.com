<template lang="pug">
v-app
  v-toolbar(app, color='primary', dark)
    v-toolbar-side-icon
    v-toolbar-title Ngirit
  v-content
    v-container(fluid)
      v-layout
        v-flex(v-if='is_loading', sm-12)
          v-card(color='primary', dark)
            v-card-text
              div Nguthek-uthek data...
              v-progress-linear.mb-0(color='white', indeterminate)
        v-flex(v-else, sm-12)
          v-card.mb-4
            v-card-title 
              h1.headline Pengeluaran
            v-card-text
              div
                span.mr-1 Hari ini:
                span.font-weight-bold Rp {{ spendingToday | digitGrouping }}
              div
                span.mr-1 Bulan ini:
                span.font-weight-bold Rp {{ spendingMonthly | digitGrouping }}
          v-card
            v-list(two-line, subheader)
              v-subheader(inset)
                span.font-weight-bold Rekap {{ dateRecap | dateFormal }}
              v-divider(inset)
              v-list-tile(v-if='items', v-for='item in filteredItems', :key='item.id', avatar)
                v-list-tile-avatar(color='red')
                  span.white--text.headline {{ item.user.name | firstLetterOnly}}
                v-list-tile-content
                  v-list-tile-title {{ item.label }}
                  v-list-tile-sub-title
                    span.font-weight-bold Rp {{ item.amount | digitGrouping }}
                    span.ml-1.mr-1 &middot;
                    span {{ item.created_at | hourOnly }} WIB
  v-btn(@click.stop='create', color='primary', dark, fab, fixed, bottom, right)
    v-icon add
  v-dialog(v-model='dialog_create', fullscreen, hide-overlay, persistent, transition='dialog-bottom-transition')
    app-form(v-if='form', @closed='itemClosed', @created='itemCreated', :form='form')
</template>

<script scoped>
import { mapState } from 'vuex';
import AppForm from './AppForm.vue'
import MixinFilters from '../../mixins/filters.js'
export default {
  name: 'Home',
  data() {
    return {
      dialog_create: false,
      is_loading: true,
      items: null,
      form: {},
    }
  },
  components: {
    AppForm
  },
  computed: {
    ...mapState({
      today: state => state.today,
      user: state => state.user,
    }),
    dateRecap() {
      return this.items[0].created_at
    },
    filteredItems() {
      return this.items.filter((row) => row.created_at.substring(0,10) === this.today).sort( (a, b) => new Date(b.created_at) - new Date(a.created_at) )
    },
    spendingMonthly() {
      let res = this.items.reduce( ( a,b ) => ({ amount : a.amount + b.amount }) )
      return res.amount
    },
    spendingToday() {
      let objs = this.items.filter((row) => row.created_at.substring(0,10) === this.today)
      let res = objs.reduce( (a, b) => ({ amount : a.amount + b.amount }) )
      return res.amount
    },
  },
  methods: {
    create() {
      this.dialog_create = true
      this.form = {
        amount: '',
        intent: 'create',
        label: '',
        user: this.user.id,
      }
    },
    itemClosed() {
      this.dialog_create = false
      this.form = {}
    },
    itemCreated(payload) {
      this.itemClosed()
      this.items.push(payload)
    }
  },
  mixins: [MixinFilters],
  mounted() {
    axios
      .get('/api/pengeluaran')
      .then( ( { data } ) => {
        this.items = data
        this.is_loading = false
      } )
      .catch(error => console.log(error))
  },

}
</script>
