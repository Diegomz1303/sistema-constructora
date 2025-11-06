// src/pages/Login.jsx
import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Error: Credenciales incorrectas')
      setLoading(false)
    } else {
      // El AuthContext detectará el cambio de sesión automáticamente
      // y redirigirá al dashboard si todo está bien.
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-container">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="login-card">
        <h2 className="login-title">
          <span>🏗️</span> Acceso a Obra
        </h2>
        <p className="login-subtitle">
          Sistema interno exclusivo para personal autorizado.
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#34495e', display: 'block', marginBottom: '0.3rem' }}>Correo Corporativo</label>
            <input
              type="email"
              placeholder="usuario@constructora.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#34495e', display: 'block', marginBottom: '0.3rem' }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button" style={{ marginTop: '1.5rem' }}>
            {loading ? 'Verificando...' : '🔐 Ingresar de forma segura'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#999' }}>
          ¿No tienes cuenta? Contacta al Ingeniero Residente.
        </p>

      </div>
    </div>
  )
}

export default Login