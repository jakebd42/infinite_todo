import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ session }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [message, setMessage] = useState('')

  async function handleMagicLink(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Check your email for the login link!')
      setEmail('')
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (session) {
    return (
      <div className="auth-section">
        <span className="user-email">{session.user.email}</span>
        <button className="btn btn-small" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    )
  }

  if (showEmailInput) {
    return (
      <div className="auth-section">
        <form onSubmit={handleMagicLink} className="auth-form">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn btn-small" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Link'}
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => setShowEmailInput(false)}
          >
            Cancel
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
      </div>
    )
  }

  return (
    <div className="auth-section">
      <button
        className="btn btn-small"
        onClick={() => setShowEmailInput(true)}
      >
        Sign In
      </button>
    </div>
  )
}
