const API_URL = import.meta.env.VITE_API_URL;

export async function register({ nombre, correo, telefono, contrasena }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, telefono, contrasena })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al registrar');
  return data;
}