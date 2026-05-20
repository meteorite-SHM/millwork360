import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('staff')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password, fullName, role)
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="brand">Millwork360</div>
          <div className="sub">Operations Portal</div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div style={{background:'var(--green-light)',color:'var(--green)',borderRadius:'var(--radius)',padding:'10px 14px',fontSize:'13px',marginBottom:'16px'}}>{success}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="form-group" style={{marginBottom:12}}>
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="Jane Smith"/>
              </div>
              <div className="form-group" style={{marginBottom:12}}>
                <label>Role</label>
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group" style={{marginBottom:12}}>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@millwork360.com"/>
          </div>
          <div className="form-group" style={{marginBottom:4}}>
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
          </div>
          <div className="auth-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="auth-toggle">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={()=>{setMode('signup');setError('')}}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={()=>{setMode('login');setError('')}}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
