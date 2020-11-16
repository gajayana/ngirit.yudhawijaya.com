<template>
  <v-dialog v-model="dialogCreate" fullscreen="fullscreen" hide-overlay="hide-overlay" transition="dialog-bottom-transition">
    <template #activator="{ on }">
      <v-btn
        bottom
        color="primary"
        dark
        fab
        fixed
        right
        v-on="on"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-form>
      <v-card flat="flat" :style="{ height: &quot;100vh&quot; }">
        <v-toolbar color="primary" dark="dark">
          <v-btn dark="dark" icon="icon" @click="dialogCreate = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Tambah Entri</v-toolbar-title>
        </v-toolbar>
        <v-container>
          <v-col class="mx-2">
            <v-text-field v-model.trim="formItem" :disabled="isProcessing" autofocus label="Barang/Jasa" type="text" />
            <v-text-field v-model.trim="formValue" :disabled="isProcessing" label="Harga" type="number" />
          </v-col>
        </v-container>
        <v-card-actions>
          <v-spacer />
          <v-btn :loading="isProcessing" color="primary" dark="dark" @click.prevent="submit">
            Kirim
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>
<script>
import { mapState } from 'vuex'
import getUnixTime from 'date-fns/getUnixTime'
export default {
  name: 'PageHomeFormCreate',
  data: () => ({
    dialogCreate: false,
    error: '',
    formItem: '',
    formValue: '',
    isProcessing: false
  }),
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    reset () {
      this.dialogCreate = false
      this.error = ''
      this.formItem = ''
      this.formValue = 0
      this.isProcessing = false
    },
    submit () {
      try {
        const { nodeEnv } = this.$config
        const collection = nodeEnv === 'development' ? 'dev-spendings' : 'spendings'
        const now = getUnixTime(new Date())
        this.isProcessing = true
        this.$fire
          .firestore
          .collection(collection)
          .add({
            label: this.formItem,
            value: parseFloat(this.formValue),
            user: this.user.uid,
            created_at: now,
            updated_at: now
          })
          .then((docRef) => {
            this.reset()
          })
          .catch((error) => {
            this.error = error.message
          })
      } catch (err) {
        this.error = {
          message: err.message
        }
      }
    }
  }
}
</script>
