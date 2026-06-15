import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { login, register, reset } from '../features/auth/authSlice'
import Spinner from '../components/Spinner'

function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  useEffect(() => {
    if (isError) toast.error(message)
    if (isSuccess || user) navigate('/dashboard')
    dispatch(reset())
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onLoginChange = (e) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onRegisterChange = (e) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onLoginSubmit = (e) => {
    e.preventDefault()
    dispatch(login({ email: loginData.email, password: loginData.password }))
  }

  const onRegisterSubmit = (e) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    dispatch(register({
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
    }))
  }

  if (isLoading) return <Spinner />

  return (
    <div style={styles.pg}>
      <div style={styles.card}>
        <div style={styles.logo}>Shirl<span style={styles.logoAccent}>y</span></div>
        <div style={styles.tagline}>Track what you buy. Know what you spend.</div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'login' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('login')}
          >
            Sign in
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'register' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={onLoginSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type='email'
                name='email'
                value={loginData.email}
                onChange={onLoginChange}
                placeholder='you@example.com'
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                <input
                    style={{ ...styles.input, paddingRight: '44px' }}
                    type={showLoginPassword ? 'text' : 'password'}
                    name='password'
                    value={loginData.password}
                    onChange={onLoginChange}
                    placeholder='••••••••'
                    required
                />
                <button
                    type='button'
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={styles.eyeBtn}
                >
                    {showLoginPassword ? '🙈' : '👁️'}
                </button>
                </div>
            </div>
            <button type='submit' style={styles.submit}>Sign in</button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                type='text'
                name='name'
                value={registerData.name}
                onChange={onRegisterChange}
                placeholder='Your name'
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type='email'
                name='email'
                value={registerData.email}
                onChange={onRegisterChange}
                placeholder='you@example.com'
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                <input
                    style={{ ...styles.input, paddingRight: '44px' }}
                    type={showRegisterPassword ? 'text' : 'password'}
                    name='password'
                    value={registerData.password}
                    onChange={onRegisterChange}
                    placeholder='Choose a password'
                    required
                />
                <button
                    type='button'
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    style={styles.eyeBtn}
                >
                    {showRegisterPassword ? '🙈' : '👁️'}
                </button>
                </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirm password</label>
              <input
                style={styles.input}
                type='password'
                name='confirmPassword'
                value={registerData.confirmPassword}
                onChange={onRegisterChange}
                placeholder='Repeat your password'
                required
              />
            </div>
            <button type='submit' style={styles.submit}>Create account</button>
          </form>
        )}

        <div style={styles.features}>
          <div style={styles.feat}><div style={styles.featDot}></div>Track prices every time you shop</div>
          <div style={styles.feat}><div style={styles.featDot}></div>Get a smart shopping list suggestion</div>
          <div style={styles.feat}><div style={styles.featDot}></div>See exactly where your money goes</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  pg: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    background: '#FAF7F2',
  },
  card: {
    background: '#fff',
    border: '0.5px solid #E2D5C3',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: '26px',
    fontWeight: '600',
    color: '#2A1E14',
    marginBottom: '4px',
  },
  logoAccent: { color: '#C87941' },
  tagline: { fontSize: '13px', color: '#8C6F5A', marginBottom: '28px', lineHeight: '1.5' },
  tabs: {
    display: 'flex',
    background: '#F0E8DC',
    borderRadius: '10px',
    padding: '3px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '8px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    color: '#8C6F5A',
    border: 'none',
    background: 'transparent',
  },
  tabActive: {
    background: '#fff',
    color: '#2A1E14',
    border: '0.5px solid #E2D5C3',
  },
  field: { marginBottom: '14px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#8C6F5A',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '0.5px solid #D4C4B0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2A1E14',
    background: '#FDFAF7',
    boxSizing: 'border-box',
  },
  submit: {
    width: '100%',
    padding: '11px',
    background: '#3D2B1F',
    color: '#FAF0E4',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '6px',
  },
  features: {
    marginTop: '22px',
    paddingTop: '18px',
    borderTop: '0.5px solid #EDE0D0',
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  feat: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#7A6050' },
  featDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#C87941', flexShrink: 0 },
  eyeBtn: {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '0',
},
}

export default LoginPage