const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Recomendaciones "Para ti" del usuario autenticado (SC-001).
export async function obtenerRecomendaciones() {
  const res = await fetch(`${API_URL}/recomendaciones`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudieron cargar las recomendaciones');
  return res.json();
}

// Activar o revocar el consentimiento de recomendaciones (SC-001).
export async function actualizarConsentimiento(usuarioId, consentimiento) {
  const res = await fetch(`${API_URL}/usuarios/${usuarioId}/consentimiento`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ consentimiento }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el consentimiento');
  return data;
}
