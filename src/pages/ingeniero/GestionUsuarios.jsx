// src/pages/ingeniero/GestionUsuarios.jsx
import { useState } from 'react'
import { supabase } from '../../services/supabase'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'react-hot-toast'

// Cliente Admin
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const GestionUsuarios = () => {
  const [newUserLoading, setNewUserLoading] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'trabajador'
  })

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setNewUserLoading(true)
    const toastId = toast.loading('Creando usuario...')

    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        email_confirm: true,
      })
      if (userError) throw userError

      if (newUserForm.role === 'ingeniero' && userData.user) {
        await supabaseAdmin.from('profiles').update({ role: 'ingeniero' }).eq('id', userData.user.id)
      }

      toast.success(`✅ Usuario ${newUserForm.email} creado`, { id: toastId })
      setNewUserForm({ email: '', password: '', role: 'trabajador' })
    } catch (error) {
      toast.error('❌ Error: ' + error.message, { id: toastId })
    } finally {
      setNewUserLoading(false)
    }
  }

  const handleNewUserChange = (e) => {
    setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Toaster position="top-center" />
      <h1 style={{ color: '#2c3e50', fontSize: '1.8rem' }}>Gestión de Personal</h1>
      <p style={{ color: '#7f8c8d', margin: '0.5rem 0 2rem 0' }}>Crea nuevas cuentas para trabajadores o ingenieros.</p>
      
      <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
         <div>
           <label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Correo</label>
           <input type="email" name="email" value={newUserForm.email} onChange={handleNewUserChange} required style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc'}}/>
         </div>
         <div>
           <label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Contraseña</label>
           <input type="text" name="password" value={newUserForm.password} onChange={handleNewUserChange} required minLength={6} style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc',fontFamily:'monospace'}}/>
         </div>
         <div>
           <label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Rol</label>
           <select name="role" value={newUserForm.role} onChange={handleNewUserChange} style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc',backgroundColor:'white'}}>
             <option value="trabajador">👷‍♂️ Trabajador</option>
             <option value="ingeniero">🏗️ Ingeniero</option>
           </select>
         </div>
         <button type="submit" disabled={newUserLoading} style={{marginTop:'1rem',padding:'1rem',background:'#3498db',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:newUserLoading?'not-allowed':'pointer'}}>
           {newUserLoading?'Creando...':'✨ Crear Usuario'}
         </button>
       </form>
    </div>
  )
}

export default GestionUsuarios