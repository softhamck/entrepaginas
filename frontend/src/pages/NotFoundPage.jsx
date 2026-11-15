import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Página 404: cualquier ruta inexistente. Voz de marca, sin dejar al usuario
// en una pantalla vacía. Lleva de vuelta a un lugar seguro según la sesión.
export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const destino = isAuthenticated ? '/catalogo' : '/login';
  const etiqueta = isAuthenticated ? 'Volver al catálogo' : 'Ir a iniciar sesión';

  return (
    <main className="nf-pantalla">
      <div className="nf-tarjeta">
        <span className="nf-codigo" aria-hidden="true">404</span>
        <h1 className="nf-titulo">Esta página no existe o se movió</h1>
        <p className="nf-texto">
          El enlace que seguiste no lleva a ninguna parte. Puede que la dirección
          esté mal escrita o que el contenido ya no esté disponible.
        </p>
        <Link to={destino} className="boton-primario nf-boton">{etiqueta}</Link>
      </div>
    </main>
  );
}
