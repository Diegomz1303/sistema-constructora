// src/utils/pushSubscription.js
import { supabase } from '../services/supabase'

// Lee la llave pública desde el archivo .env.local
const VAPID_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_VAPID_KEY

// --- DIAGNÓSTICO: Esto imprimirá la llave en la consola del navegador ---
console.log("🔑 VAPID KEY EN USO:", VAPID_PUBLIC_KEY)

// Función auxiliar para convertir la llave VAPID
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error('VAPID_PUBLIC_KEY no está definida. Revisa tu archivo .env.local')
  }
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Función principal para suscribirse
export async function subscribeToPushNotifications(user) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Las notificaciones Push no son soportadas por este navegador.')
  }

  // 1. Registrar el Service Worker
  // Usamos 'updateViaCache: none' para asegurar que siempre use la versión más reciente
  const registration = await navigator.serviceWorker.register('/service-worker.js', {
    updateViaCache: 'none' 
  })

  // Esperar a que el SW esté activo
  await navigator.serviceWorker.ready

  // 2. Pedir permiso al usuario
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permiso de notificaciones denegado por el usuario.')
  }

  // 3. Suscribirse al PushManager con nuestra llave pública
  // Primero intentamos obtener una suscripción existente para no crear duplicados
  let subscription = await registration.pushManager.getSubscription()

  // Si no existe, creamos una nueva
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
  }

  // 4. Guardar la suscripción en Supabase
  // Usamos 'upsert' para crear o actualizar si ya existe para este usuario
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ 
      user_id: user.id,
      subscription: subscription 
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error guardando suscripción en BD:', error)
    throw error
  }

  console.log('✅ Suscripción guardada con éxito para:', user.email)
  return subscription
}