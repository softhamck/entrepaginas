import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege rutas (HU-05). soloAdmin exige rol ADMIN.
export default function RutaProtegida({ soloAdmin = false }) {
  const { isAuthenticated, esAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (soloAdmin && !esAdmin) return <Navigate to="/catalogo" replace />;
  return <Outlet />;
}