// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Creamos una función robusta para chequear la sesión Y el rol
    const checkUserAndRole = async () => {
      try {
        // Obtenemos la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          setUser(session.user)
          
          // Si hay sesión, BUSCAMOS EL ROL en la tabla 'profiles'
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            // Error común: El usuario existe en auth pero no en profiles (lo borraste a mano, etc)
            console.warn("No se pudo encontrar el perfil, asignando 'trabajador' por defecto.")
            setRole('trabajador')
          } else if (profileData) {
            setRole(profileData.role)
          }

        } else {
          // No hay sesión
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error("Error al cargar la sesión:", error)
        setUser(null)
        setRole(null)
      } finally {
        // ¡LO MÁS IMPORTANTE!
        // Pase lo que pase (éxito o error), le decimos a la app que deje de cargar.
        setLoading(false)
      }
    }

    // Ejecutamos la función al cargar la página
    checkUserAndRole()

    // 2. Escuchamos cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Cuando hay un cambio (login o logout), simplemente re-ejecutamos toda la lógica de chequeo.
      // Esto es más simple y asegura que siempre tengamos el rol correcto.
      setLoading(true) // Ponemos loading mientras revisamos de nuevo
      checkUserAndRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    signOut: () => supabase.auth.signOut(),
    user,
    role,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Ahora `loading` SÍ se pondrá en `false` garantizado.
        Si 'loading' es false, mostramos los hijos (la app).
      */}
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}