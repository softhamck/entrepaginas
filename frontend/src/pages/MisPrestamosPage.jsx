import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerHistorial, renovarPrestamo } from '../services/prestamoService';
import '../app.css';

const TABS = [
  { id: 'ACTIVO', label: 'Activos' },
  { id: 'VENCIDO', label: 'Vencidos' },
  { id: 'DEVUELTO', label: 'Devueltos' },
];

function fecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function moneda(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function EstadoPrestamo({ estado }) {
  const mapa = {
    ACTIVO: { clase: 'estado-ok', texto: 'Activo' },
    VENCIDO: { clase: 'estado-no', texto: 'Vencido' },
    DEVUELTO: { clase: 'estado-neutro', texto: 'Devuelto' },
  };
  const e = mapa[estado] || mapa.ACTIVO;
  return (
    <span className={`estado ${e.clase}`}>
      <span className="estado-punto" aria-hidden="true">●</span>{e.texto}
    </span>
  );
}

export default function MisPrestamosPage() {
  const { usuario } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ACTIVO');

  const [renovandoId, setRenovandoId] = useState(null);
  const [aviso, setAviso] = useState('');
  const [avisoError, setAvisoError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    obtenerHistorial(usuario.id)
      .then((datos) => { if (activo) setPrestamos(datos); })
      .catch(() => { if (activo) setError('No pudimos cargar tus préstamos.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [usuario.id]);

  useEffect(() => cargar(), [cargar]);

  const onRenovar = (id) => {
    setRenovandoId(id);
    setAviso('');
    setAvisoError('');
    renovarPrestamo(id)
      .then(() => { setAviso('Préstamo renovado. Se extendió 14 días más.'); cargar(); })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setRenovandoId(null));
  };

  const visibles = prestamos.filter((p) => p.estado === tab);
  const etiquetaTab = TABS.find((t) => t.id === tab).label.toLowerCase();
  const mostrarAcciones = tab === 'ACTIVO';

  return (
    <section>
      <h1 className="cat-titulo">Mis préstamos</h1>
      <p className="cat-conteo">Tu actividad de préstamos en la biblioteca.</p>

      <div className="cat-vista" style={{ margin: '18px 0 20px', display: 'inline-flex' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'activo' : ''}
            onClick={() => { setTab(t.id); setAviso(''); setAvisoError(''); }}>
            {t.label}
          </button>
        ))}
      </div>

      {aviso && <p className="mensaje" style={{ color: '#1f7a48' }}>{aviso}</p>}
      {avisoError && <p className="mensaje-error">{avisoError}</p>}

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && !error && visibles.length === 0 && (
        <div className="prest-vacio">
          <p className="mensaje">No tienes préstamos {etiquetaTab}.</p>
          {tab === 'ACTIVO' && (
            <Link to="/catalogo" className="boton-secundario" style={{ marginTop: 12, display: 'inline-block' }}>
              Explorar el catálogo
            </Link>
          )}
        </div>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <table className="cat-tabla">
          <thead>
            <tr>
              <th>Libro</th><th>Préstamo</th><th>Vencimiento</th><th>Estado</th><th>Multa</th>
              {mostrarAcciones && <th></th>}
            </tr>
          </thead>
          <tbody>
            {visibles.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.libro.titulo}</strong>
                  <div className="prest-autor">{p.libro.autor}</div>
                </td>
                <td>{fecha(p.fechaPrestamo)}</td>
                <td>
                  {fecha(p.fechaVencimiento)}
                  {p.estado === 'ACTIVO' && p.porVencer && (
                    <div className="prest-aviso">Vence en {p.diasRestantes} día{p.diasRestantes === 1 ? '' : 's'}</div>
                  )}
                </td>
                <td><EstadoPrestamo estado={p.estado} /></td>
                <td>{p.multa ? <span className="celda-error">{moneda(p.multa.monto)}</span> : '—'}</td>
                {mostrarAcciones && (
                  <td>
                    <button
                      type="button"
                      className="boton-secundario"
                      style={{ padding: '6px 16px' }}
                      onClick={() => onRenovar(p.id)}
                      disabled={renovandoId === p.id}
                    >
                      {renovandoId === p.id ? 'Renovando…' : 'Renovar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}



