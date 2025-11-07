// public/service-worker.js

// Escucha el evento 'push' (la notificación que llega del servidor)
self.addEventListener('push', (event) => {
  const data = event.data.json(); // Parsea los datos que enviamos (título, cuerpo)
  
  const options = {
    body: data.body,
    icon: '/vite.svg', // Puedes cambiar esto por el logo de tu app
    badge: '/vite.svg', // Ícono para Android
    data: {
      // URL a la que irá el usuario si hace clic en la notificación
      url: data.url || '/' 
    }
  };

  // Muestra la notificación
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Escucha el evento 'notificationclick' (cuando el usuario toca la notificación)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Cierra la notificación

  const urlToOpen = event.notification.data.url || '/';

  // Abre la pestaña del navegador o la enfoca si ya está abierta
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});