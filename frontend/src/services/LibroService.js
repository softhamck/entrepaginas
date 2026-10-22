const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Catálogo con búsqueda y filtros (los filtros se usan desde HU-08).
export async function listarCatalogo({ q, categoria, disponibles } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoria) params.set('categoria', categoria);
  if (disponibles) params.set('disponibles', 'true');
  const res = await fetch(`${API_URL}/libros?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudo cargar el catálogo');
  return res.json();
}
