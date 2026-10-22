import { useParams, Link } from 'react-router-dom';
import '../app.css';

const LABELS = {
  'mis-prestamos': 'Mis préstamos',
  'mi-perfil': 'Mi perfil',
  dashboard: 'Dashboard',
  prestamos: 'Gestión de préstamos',
  colas: 'Colas de espera',
  usuarios: 'Usuarios y multas',
};

export default function ProximamentePage() {
  const { seccion } = useParams();
  const titulo = LABELS[seccion] || 'Esta sección';

  return (
    <section className="proximamente">
      <h1 className="cat-titulo">{titulo}</h1>
      <p className="cat-conteo">Esta sección estará disponible en un próximo sprint.</p>
      <Link to="/catalogo" className="boton-secundario" style={{ marginTop: 16, display: 'inline-block' }}>
        Ir al catálogo
      </Link>
    </section>
  );
}
