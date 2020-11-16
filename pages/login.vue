<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" fluid="fluid">
        <v-row align="center" justify="center" no-gutters="no-gutters">
          <v-col cols="12" sm="6" md="5" lg="3">
            <v-form>
              <v-card class="elevation-12">
                <v-toolbar color="primary" dark="dark" flat="flat">
                  <v-toolbar-title>Catat Masuk</v-toolbar-title>
                </v-toolbar>
                <v-card-text>
                  <v-text-field
                    v-model.trim="email"
                    :autofocus="true"
                    :disabled="isProcessing"
                    autocomplete="username"
                    label="Email"
                    name="email"
                    type="text"
                  />
                  <v-text-field
                    v-model.trim="password"
                    :disabled="isProcessing"
                    autocomplete="current-password"
                    label="Sandi"
                    name="password"
                    type="password"
                  />
                </v-card-text>
                <div v-if="error" class="col-12" :style="{ paddingBottom: 0, paddingTop: 0 }">
                  <v-alert
                    :style="{ marginBottom: 0 }"
                    dense="dense"
                    type="error"
                  >
                    {{ error.message }}
                  </v-alert>
                </div>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    :disabled="isProcessing"
                    :loading="isProcessing"
                    color="primary"
                    @click="signIn"
                  >
                    Masuk
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-form>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<script>
import { mapState } from 'vuex'
export default {
  data: () => ({
    email: '',
    error: '',
    isProcessing: false,
    password: ''
  }),
  head () {
    return {
      title: 'Login'
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    user (val) {
      if (val) { this.$router.push('/') }
    }
  },
  methods: {
    signIn () {
      try {
        this.error = ''
        this.isProcessing = true
        this.$fire
          .auth
          .signInWithEmailAndPassword(this.email, this.password)
          .catch((error) => {
            this.isProcessing = false
            this.error = {
              message: error.message
            }
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
