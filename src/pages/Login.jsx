// src/pages/Login.jsx
import { useState } from 'react'
import { supabase } from '../services/supabase'
import { Toaster, toast } from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // IMPORTANTE: Esto asegura que al hacer clic en el link del correo,
        // el usuario vuelva a la página correcta de tu app.
        emailRedirectTo: window.location.origin,
      }
    })

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('¡Enlace enviado! Revisa tu correo.')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="login-card">
        <h2 className="login-title">
          <span>🏗️</span> Acceso a Obra
        </h2>
        <p className="login-subtitle">
          Ingresa tu correo corporativo para recibir el enlace de acceso directo.
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="ejemplo@constructora.com"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Enviando...' : 'Enviar enlace mágico ✨'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login