import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCatalogo } from '../services/libroService';
import EstadoDisponibilidad from '../components/EstadoDisponibilidad';
import Portada from '../components/Portada';
import '../app.css';

export default function CatalogoPage() {
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    listarCatalogo({})
      .then((datos) => { if (activo) setLibros(datos); })
      .catch(() => { if (activo) setError('No pudimos cargar el catálogo.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  return (
    <section>
      <h1 className="cat-titulo">Catálogo</h1>
      <p className="cat-conteo">{libros.length} títulos</p>

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}
      {!cargando && !error && libros.length === 0 && (
        <p className="mensaje">No hay libros en el catálogo.</p>
      )}

      <div className="cat-grid">
        {libros.map((libro) => (
          <Link key={libro.id} to={`/libros/${libro.id}`} className="libro-card">
            <Portada />
            <h3 className="libro-titulo">{libro.titulo}</h3>
            <p className="libro-autor">{libro.autor}</p>
            <div className="libro-fila">
              <EstadoDisponibilidad disponible={libro.disponible} />
              <span className="libro-ejemplares">{libro.disponibles} de {libro.ejemplares}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
