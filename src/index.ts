// Config<SessionGeneric>
  // - [ ] OIDC provider config ??? Auth code flow only?

  // Session persistence
  // Has its own interface, comes with drivers and no-op driver
  // - [ ] storeSession(token)
  // - [ ] loadSession()

// Public methods
// - [ ] signInWithProvider()
// - [ ] signInWithCredentials()
// - [ ] signOut()
// - [ ] getSession() // This will auto refresh the token if expired
// - [ ] deleteSession()
// - [ ] getSignInError()
// - [ ] redirectHandler(HTTP req url) // This willl then trigger the session persistence 