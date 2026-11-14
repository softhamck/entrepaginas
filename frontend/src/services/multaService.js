const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Listar todas las multas (HU-15, solo admin).
export async function listarMultas() {
  const res = await fetch(`${API_URL}/multas`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudieron cargar las multas');
  return res.json();
}

// Registrar el pago de una multa (HU-15, solo admin).
export async function pagarMulta(id) {
  const res = await fetch(`${API_URL}/multas/${id}/pagar`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo registrar el pago');
  return data;
}