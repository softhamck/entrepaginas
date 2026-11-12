import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerDetalle } from '../services/libroService';
import { solicitarPrestamo } from '../services/prestamoService';
import EstadoDisponibilidad from '../components/EstadoDisponibilidad';
import Portada from '../components/Portada';
import '../app.css';

export default function DetalleLibroPage() {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [solicitando, setSolicitando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [avisoError, setAvisoError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    obtenerDetalle(id)
      .then((datos) => { if (activo) setLibro(datos); })
      .catch((err) => {
        if (activo) {
          setError(err.message === 'LIBRO_NO_ENCONTRADO' ? 'Libro no encontrado.' : 'No pudimos cargar el libro.');
        }
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id]);

  useEffect(() => cargar(), [cargar]);

  const onSolicitar = () => {
    setSolicitando(true);
    setAviso('');
    setAvisoError('');
    solicitarPrestamo(Number(id))
      .then(() => {
        setAviso('Préstamo registrado. Tienes 14 días para devolverlo.');
        cargar(); // refresca la disponibilidad
      })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setSolicitando(false));
  };

  return (
    <section>
      <div className="det-top">
        <span className="det-breadcrumb">
          <Link to="/catalogo" className="tabla-link">Catálogo</Link> → {libro ? libro.titulo : '…'}
        </span>
        <Link to="/catalogo" className="boton-secundario">Volver al catálogo</Link>
      </div>

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {libro && (
        <div className="det-cuerpo">
          <Portada grande />
          <div className="det-info">
            <EstadoDisponibilidad disponible={libro.disponible} />
            <h1 className="det-titulo">{libro.titulo}</h1>
            <p className="det-autor">{libro.autor}</p>

            <div className="det-meta">
              <div><span className="det-meta-label">Código</span><span className="det-meta-valor">{libro.codigo || '—'}</span></div>
              <div><span className="det-meta-label">Categoría</span><span className="det-meta-valor">{libro.categoria || '—'}</span></div>
              <div><span className="det-meta-label">Signatura</span><span className="det-meta-valor">{libro.signatura || '—'}</span></div>
            </div>

            {libro.descripcion && (
              <>
                <h2 className="det-subtitulo">Sinopsis</h2>
                <p className="det-descripcion">{libro.descripcion}</p>
              </>
            )}

            <div className="det-acciones">
              <button
                className="boton-primario"
                type="button"
                onClick={onSolicitar}
                disabled={!libro.disponible || solicitando}
              >
                {solicitando ? 'Solicitando…' : 'Solicitar préstamo'}
              </button>
              <button className="boton-secundario" type="button" disabled>Unirme a cola de espera</button>
            </div>

            {aviso && <p className="mensaje" style={{ color: '#1f7a48', marginTop: 10 }}>{aviso}</p>}
            {avisoError && <p className="mensaje-error" style={{ marginTop: 10 }}>{avisoError}</p>}
            {!libro.disponible && !aviso && (
              <p className="det-nota">No hay ejemplares disponibles por ahora. La reserva en cola se habilita pronto.</p>
            )}

            <div className="det-caja">
              <div><strong>{libro.ejemplares}</strong><span>Ejemplares</span></div>
              <div><strong>{libro.disponibles}</strong><span>Disponibles</span></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

