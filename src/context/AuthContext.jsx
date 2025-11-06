// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

// Creamos el contexto
const AuthContext = createContext({})

// Este componente envolverá a toda tu aplicación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Revisar si ya hay una sesión activa al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Escuchar cambios (cuando inicia o cierra sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Un valor que compartiremos con toda la app
  const value = {
    signUp: (data) => supabase.auth.signUp(data), // Opcional por ahora
    signIn: (data) => supabase.auth.signInWithPassword(data), // Opcional por ahora
    signOut: () => supabase.auth.signOut(),
    user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Un hook personalizado para usar este contexto fácilmente en cualquier componente
export const useAuth = () => {
  return useContext(AuthContext)
}