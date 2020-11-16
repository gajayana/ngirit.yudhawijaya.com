export default function ({ store, redirect, route }) {
  if (!store.state.auth.user && route.name !== 'login') {
    redirect('/login')
  }
}
