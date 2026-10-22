import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CatalogoPage from './pages/CatalogoPage';
import DetalleLibroPage from './pages/DetalleLibroPage';
import ImportarPage from './pages/ImportarPage';
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
            <Route path="/libros/:id" element={<DetalleLibroPage />} />
            <Route path="/proximamente/:seccion" element={<ProximamentePage />} />

            {/* Solo administrador */}
            <Route element={<RutaProtegida soloAdmin />}>
              <Route path="/admin/importar" element={<ImportarPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/catalogo" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
