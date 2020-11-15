<template>
  <v-form>
    <v-card flat="flat" :style="{ height: &quot;100vh&quot; }">
      <v-toolbar color="primary" dark="dark">
        <v-btn dark="dark" icon="icon" @click="dialog_create = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Tambah Entri</v-toolbar-title>
      </v-toolbar>
      <v-container>
        <v-col class="mx-2">
          <v-text-field v-model.trim="form_item" :disabled="is_processing" label="Barang/Jasa" type="text" />
          <v-text-field v-model.trim="form_value" :disabled="is_processing" label="Harga" type="number" />
        </v-col>
      </v-container>
      <v-card-actions>
        <v-spacer />
        <v-btn :loading="is_processing" color="primary" dark="dark" @click.prevent="submit">
          Kirim
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>
<script>
// import { createHelpers } from 'vuex-map-fields'
// import { mapActions, mapState } from 'vuex'

// const { mapFields } = createHelpers({
//   getterType: 'spendings/getField',
//   mutationType: 'spendings/updateField'
// })

// export default {
//   props: {
//     intent: {
//       type: String,
//       default: 'create'
//     }
//   },
//   computed: {
//     ...mapFields(['dialog_create', 'form_item', 'form_value']),
//     ...mapState({
//       is_processing: (state) => {
//         return state.spendings.is_processing
//       },
//       user: (state) => {
//         return state.auth.user
//       }
//     })
//   },
//   methods: {
//     ...mapActions({
//       createSpending: 'spendings/create'
//     }),
//     submit () {
//       if (this.is_processing) {
//         return
//       }

//       if (this.intent === 'create') {
//         this.createSpending(this.user)
//       }
//     }
//   }
// }
</script>
