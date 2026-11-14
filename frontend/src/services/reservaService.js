const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Unirse a la cola de espera de un libro (HU-18).
export async function crearReserva(libroId) {
  const res = await fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ libroId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo crear la reserva');
  return data;
}

// Mis reservas con la posición en la cola (HU-18).
export async function misReservas() {
  const res = await fetch(`${API_URL}/reservas`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudieron cargar tus reservas');
  return res.json();
}
