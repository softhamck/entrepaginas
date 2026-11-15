import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CatalogoPage from './pages/CatalogoPage';
import DetalleLibroPage from './pages/DetalleLibroPage';
import ImportarPage from './pages/ImportarPage';
import MisPrestamosPage from './pages/MisPrestamosPage';
import GestionPrestamosPage from './pages/GestionPrestamosPage';
import UsuariosMultasPage from './pages/UsuariosMultasPage';
import MiPerfilPage from './pages/MiPerfilPage';
import ColasEsperaPage from './pages/ColasEsperaPage';
import ProximamentePage from './pages/ProximamentePage';
import NotFoundPage from './pages/NotFoundPage';
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
            <Route path="/mis-prestamos" element={<MisPrestamosPage />} />
            <Route path="/mi-perfil" element={<MiPerfilPage />} />
            <Route path="/proximamente/:seccion" element={<ProximamentePage />} />

            {/* Solo administrador */}
            <Route element={<RutaProtegida soloAdmin />}>
              <Route path="/admin/importar" element={<ImportarPage />} />
              <Route path="/admin/prestamos" element={<GestionPrestamosPage />} />
              <Route path="/admin/usuarios" element={<UsuariosMultasPage />} />
              <Route path="/admin/colas" element={<ColasEsperaPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/catalogo" />} />

        {/* Cualquier ruta inexistente: página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
