/* eslint-disable space-before-function-paren */
export default function({ store, redirect, route }) {
  if (store.state.auth.user !== null && route.name === 'login') {
    redirect('/')
  }
  if (store.state.auth.user === null) {
    redirect('/login')
  }
}
