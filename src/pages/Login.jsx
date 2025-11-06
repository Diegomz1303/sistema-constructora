// src/pages/Login.jsx
import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { Mail, Lock, HardHat, ArrowRight, Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    // --- CORRECCIÓN AQUÍ ---
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Credenciales incorrectas')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  // --- ESTILOS ---
  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: '1rem'
  }

  const cardStyle = {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center'
  }

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: '1rem'
  }

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8'
  }

  // Estilo base para inputs
  const baseInputStyle = {
    width: '100%',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    color: '#1e293b',
    backgroundColor: '#f8fafc'
  }

  // Estilo específico para el botón del ojo
  const eyeButtonStyle = {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  return (
    <div style={pageStyle}>
      <Toaster position="top-center" />

      <div style={cardStyle} className="animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', padding: '16px', borderRadius: '20px', 
            backgroundColor: '#eff6ff', color: '#3b82f6', marginBottom: '1rem' 
          }}>
            <HardHat size={40} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
            Acceso a Obra
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
            Sistema interno de gestión y reportes
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }} autoComplete="on">
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
              Correo Corporativo
            </label>
            <div style={inputContainerStyle}>
              <Mail size={20} style={iconStyle} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@constructora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ ...baseInputStyle, padding: '0.9rem 1rem 0.9rem 2.8rem' }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'white' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
              Contraseña
            </label>
            <div style={inputContainerStyle}>
              <Lock size={20} style={iconStyle} />
              
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...baseInputStyle, padding: '0.9rem 2.8rem 0.9rem 2.8rem' }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'white' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeButtonStyle}
                tabIndex="-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              backgroundColor: '#3b82f6', color: 'white', fontSize: '1.1rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)')}
          >
            {loading ? 'Verificando...' : (
              <>Ingresar de forma segura <ArrowRight size={20} /></>
            )}
          </button>

        </form>

        <p style={{ marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          ¿Problemas para acceder? <br/> Contacta directamente al Ingeniero Residente.
        </p>
      </div>
    </div>
  )
}

export default Login