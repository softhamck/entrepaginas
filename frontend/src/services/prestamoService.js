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

