import { useEffect, useState, useCallback } from 'react';
import { listarColas } from '../services/reservaService';
import '../app.css';

function fecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ColasEsperaPage() {
  const [colas, setColas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    listarColas()
      .then((datos) => { if (activo) setColas(datos); })
      .catch(() => { if (activo) setError('No pudimos cargar las colas de espera.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => cargar(), [cargar]);

  return (
    <section>
      <h1 className="cat-titulo">Colas de espera</h1>
      <p className="cat-conteo">Libros con reservas pendientes, por orden de llegada.</p>

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && !error && colas.length === 0 && (
        <div className="prest-vacio"><p className="mensaje">No hay colas de espera activas.</p></div>
      )}

      {!cargando && !error && colas.map((c) => (
        <div key={c.libro.id} style={{ marginTop: 20 }}>
          <h2 className="det-subtitulo">{c.libro.titulo} <span style={{ fontWeight: 400, color: '#6b6b6b' }}>· {c.libro.autor}</span></h2>
          <table className="cat-tabla">
            <thead>
              <tr><th>Posición</th><th>Asociado</th><th>Solicitada</th></tr>
            </thead>
            <tbody>
              {c.cola.map((r) => (
                <tr key={r.id}>
                  <td>#{r.posicion}</td>
                  <td>{r.usuario.nombre}</td>
                  <td>{fecha(r.fechaSolicitud)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
