import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CatalogoPage from './pages/CatalogoPage';
import ProximamentePage from './pages/ProximamentePage';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas: requieren sesión (HU-05) */}
        <Route element={<RutaProtegida />}>
          <Route element={<Layout />}>
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/proximamente/:seccion" element={<ProximamentePage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/catalogo" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
