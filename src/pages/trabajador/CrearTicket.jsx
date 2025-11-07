// src/pages/trabajador/CrearTicket.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import { Toaster, toast } from 'react-hot-toast'
import { Camera, UploadCloud, X, UserCircle2 } from 'lucide-react'

const CrearTicket = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [location, setLocation] = useState({ lat: null, lng: null, error: null })
  const [engineers, setEngineers] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    type: 'material',
    assigned_to: ''
  })

  // --- ESTILOS COMUNES ---
  const containerStyle = {
    maxWidth: '1000px',
    width: '95%',
    margin: '0 auto',
    // Padding responsivo: menos en móvil, más en desktop
    padding: window.innerWidth < 768 ? '1.5rem' : '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#334155',
    fontSize: '0.95rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '1rem',
    color: '#1e293b',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation(prev => ({ ...prev, error: "No soportado" }))
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null }),
        (err) => {
          console.error("Error GPS:", err);
          setLocation(prev => ({ ...prev, error: "Ubicación no disponible" }))
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    const fetchEngineers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'ingeniero')
      if (data) setEngineers(data)
    }
    fetchEngineers()
  }, [])

  useEffect(() => {
    return () => imagePreview && URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return toast.error('Falta título o descripción')
    if (!formData.assigned_to) return toast.error('Debes asignar un ingeniero')

    setLoading(true)
    const toastId = toast.loading('Enviando reporte...')

    try {
      let finalImageUrl = null
      if (imageFile) {
        const fileName = `${user.id}-${Date.now()}.${imageFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('evidencia').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('evidencia').getPublicUrl(fileName)
        finalImageUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from('tickets').insert([{
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        type: formData.type,
        status: 'pendiente',
        user_email: user.email,
        image_url: finalImageUrl,
        latitude: location.lat,
        longitude: location.lng,
        assigned_to: formData.assigned_to
      }])

      if (insertError) throw insertError
      toast.success('¡Reporte creado!', { id: toastId })
      navigate('/dashboard')
    } catch (error) {
      toast.error('Error: ' + error.message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem', minHeight: '100%', display: 'flex', justifyContent: 'center' }}>
      <Toaster position="top-center" />

      <div style={containerStyle} className="animate-fade-in">
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: '#eff6ff', borderRadius: '50%', marginBottom: '1rem' }}>
            <Camera size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 0.5rem 0', fontWeight: '800' }}>Nuevo Reporte</h1>
          
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500',
            backgroundColor: location.lat ? '#dcfce7' : '#fee2e2',
            color: location.lat ? '#166534' : '#991b1b'
          }}>
            <span>{location.lat ? '📍' : '⚠️'}</span>
            {location.lat ? `Ubicación detectada` : location.error || "Buscando GPS..."}
          </div>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div>
            <label style={labelStyle}>¿Qué tipo de reporte es?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['material', 'incidencia', 'duda'].map((type) => (
                <label key={type} style={{
                  padding: '0.8rem',
                  border: formData.type === type ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  backgroundColor: formData.type === type ? '#eff6ff' : 'white',
                  borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s', fontWeight: '600',
                  color: formData.type === type ? '#1d4ed8' : '#64748b',
                  textTransform: 'capitalize', fontSize: '0.9rem'
                }}>
                  <input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleChange} style={{ display: 'none' }} />
                  <span style={{ display: 'block', fontSize: '1.4rem', marginBottom: '0.2rem' }}>
                    {type === 'material' ? '🧱' : type === 'incidencia' ? '⚠️' : '❓'}
                  </span>
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* --- CAMBIO CLAVE PARA RESPONSIVE --- */}
          {/* Usamos flex-wrap para que caigan en una columna si no hay espacio */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            
            {/* Asunto: Ocupa todo el ancho disponible, mínimo 300px */}
            <div style={{ flex: '1 1 300px' }}>
              <label style={labelStyle}>Asunto Principal *</label>
              <input 
                type="text" name="title" placeholder="Ej: Falta cemento en Zona B" 
                value={formData.title} onChange={handleChange} maxLength={60}
                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: '500' }}
              />
            </div>

            {/* Prioridad y Asignación: Intentan compartir fila, si no caben, saltan */}
            <div style={{ flex: '1 1 150px' }}>
              <label style={labelStyle}>Prioridad</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🔴 Alta</option>
              </select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
               <label style={labelStyle}>Asignar a *</label>
               <div style={{ position: 'relative' }}>
                 <UserCircle2 size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                 <select 
                    name="assigned_to" 
                    value={formData.assigned_to} 
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                    required
                 >
                   <option value="">Seleccionar...</option>
                   {engineers.map(eng => (
                     <option key={eng.id} value={eng.id}>
                        {eng.email ? eng.email.split('@')[0] : 'Ingeniero'}
                     </option>
                   ))}
                 </select>
               </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Evidencia Fotográfica</label>
            {!imageFile ? (
              <label style={{ 
                border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.8rem', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s'
              }}>
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                <div style={{ background: '#e0f2fe', padding: '0.8rem', borderRadius: '50%' }}>
                  <UploadCloud size={24} color="#0ea5e9" />
                </div>
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  <span style={{ color: '#0ea5e9', fontWeight: '600' }}>Toca para subir foto</span>
                </div>
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={removeImage} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Detalles Adicionales *</label>
            <textarea name="description" rows="4" placeholder="Describe el problema..." value={formData.description} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '0.8rem', border: 'none', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.8rem', border: 'none', borderRadius: '12px', backgroundColor: loading ? '#94a3b8' : '#3b82f6', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Enviando...' : <>Enviar 🚀</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CrearTicket