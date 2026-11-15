import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// Lee el rol, el id y la expiración (exp) del JWT sin librerías externas.
function datosDelToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, rol: payload.rol, exp: payload.exp };
  } catch {
    return null;
  }
}

// true si el token ya venció (exp viene en segundos).
function expirado(datos) {
  return Boolean(datos?.exp) && datos.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }) {
  // Al cargar: si el token guardado ya venció, no iniciamos sesión con él.
  const [token, setToken] = useState(() => {
    const guardado = localStorage.getItem('token');
    if (expirado(datosDelToken(guardado))) {
      localStorage.removeItem('token');
      return null;
    }
    return guardado;
  });

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const usuario = datosDelToken(token);

  // Cierra la sesión automáticamente en el momento exacto en que vence el JWT,
  // así la sesión no queda abierta indefinidamente (JWT de 2h en el backend).
  useEffect(() => {
    if (!usuario?.exp) return;
    const restanteMs = usuario.exp * 1000 - Date.now();
    const id = setTimeout(logout, Math.max(restanteMs, 0));
    return () => clearTimeout(id);
  }, [usuario?.exp]);

  return (
    <AuthContext.Provider
      value={{ token, login, logout, isAuthenticated: Boolean(token), usuario, esAdmin: usuario?.rol === 'ADMIN' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}
