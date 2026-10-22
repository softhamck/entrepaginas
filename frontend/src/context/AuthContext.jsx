import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Lee el rol y el id del JWT sin librerías externas.
function datosDelToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, rol: payload.rol };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const usuario = datosDelToken(token);

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
