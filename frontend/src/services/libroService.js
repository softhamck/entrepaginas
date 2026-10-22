const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Catálogo con búsqueda y filtros (HU-08).
export async function listarCatalogo({ q, categoria, disponibles } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoria) params.set('categoria', categoria);
  if (disponibles) params.set('disponibles', 'true');
  const res = await fetch(`${API_URL}/libros?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('No se pudo cargar el catálogo');
  return res.json();
}

// Detalle de un libro (HU-09).
export async function obtenerDetalle(id) {
  const res = await fetch(`${API_URL}/libros/${id}`, { headers: authHeaders() });
  if (res.status === 404) throw new Error('LIBRO_NO_ENCONTRADO');
  if (!res.ok) throw new Error('No se pudo cargar el libro');
  return res.json();
}

// Importar inventario desde Excel/CSV (HU-06).
export async function importarInventario(archivo, duplicados) {
  const form = new FormData();
  form.append('archivo', archivo);
  if (duplicados) form.append('duplicados', duplicados);
  const res = await fetch(`${API_URL}/libros/importar`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo importar el archivo');
  return data;
}
