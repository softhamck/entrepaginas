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

export async function login({ correo, contrasena }) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
  } catch {
    throw new Error('SERVICIO_NO_DISPONIBLE'); // backend no respondió / sin red
  }
  if (response.status >= 500) throw new Error('SERVICIO_NO_DISPONIBLE');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'CREDENCIALES_INVALIDAS');
  return data; // { token }
}