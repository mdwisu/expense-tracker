import { cookies } from 'next/headers'

// Hard-coded credentials
const CREDENTIALS = {
  username: 'mdwisu',
  password: 'Mdw!su@2024#SecureP@ss', // Password yang sulit
}

const SESSION_COOKIE_NAME = 'expense_tracker_session'
const SESSION_DURATION_SHORT = 24 * 60 * 60 * 1000 // 1 day in milliseconds
const SESSION_DURATION_LONG = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

export async function authenticate(username: string, password: string, rememberMe: boolean = false) {
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    const duration = rememberMe ? SESSION_DURATION_LONG : SESSION_DURATION_SHORT
    const expiresAt = new Date(Date.now() + duration)

    // Create session token (simple token for demo)
    const sessionToken = Buffer.from(
      JSON.stringify({
        username: CREDENTIALS.username,
        createdAt: Date.now(),
        expiresAt: expiresAt.getTime(),
      })
    ).toString('base64')

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return { success: true }
  }

  return { success: false, error: 'Username atau password salah' }
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      await logout()
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function isAuthenticated() {
  const session = await getSession()
  return session !== null
}
