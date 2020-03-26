/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
export default function ({ store, redirect, route }) {
  if (!store.state.auth.user && route.name !== 'login') {
    redirect('/login')
  }
}
