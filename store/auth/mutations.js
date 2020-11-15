export default {
  onAuthStateChanged (state, { authUser, claims }) {
    if (!authUser) {
      claims = null
      state.user = ''
    } else {
      const { uid, email, emailVerified, displayName, photoURL } = authUser
      state.user = {
        uid,
        displayName,
        email,
        emailVerified,
        photoURL: photoURL || null, // results in photoURL being null for server auth
        // use custom claims to control access (see https://firebase.google.com/docs/auth/admin/custom-claims)
        isAdmin: claims.custom_claim
      }
    }
  },
  reset (state) {
    state.user = ''
  }
}
