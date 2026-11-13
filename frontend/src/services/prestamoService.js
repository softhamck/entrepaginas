const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Solicitar el préstamo de un libro (HU-11).
export async function solicitarPrestamo(libroId) {
  const res = await fetch(`${API_URL}/prestamos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ libroId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo registrar el préstamo');
  return data;
}

// Historial de préstamos del usuario (HU-14).
export async function obtenerHistorial(usuarioId) {
  const res = await fetch(`${API_URL}/usuarios/${usuarioId}/prestamos`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudo cargar el historial de préstamos');
  return res.json();
}

// Renovar un préstamo activo (HU-13).
export async function renovarPrestamo(prestamoId) {
  const res = await fetch(`${API_URL}/prestamos/${prestamoId}/renovar`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo renovar el préstamo');
  return data;
}
