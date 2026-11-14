import { useEffect, useState, useCallback } from 'react';
import { listarPrestamos, registrarDevolucion } from '../services/prestamoService';
import '../app.css';

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

export default function GestionPrestamosPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [devolviendoId, setDevolviendoId] = useState(null);
  const [aviso, setAviso] = useState('');
  const [avisoError, setAvisoError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    listarPrestamos('ACTIVO')
      .then((datos) => { if (activo) setPrestamos(datos); })
      .catch(() => { if (activo) setError('No pudimos cargar los préstamos.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => cargar(), [cargar]);

  const onDevolver = (p) => {
    setDevolviendoId(p.id);
    setAviso('');
    setAvisoError('');
    registrarDevolucion(p.id)
      .then((r) => {
        let msg = `Devolución registrada: "${p.libro.titulo}".`;
        if (r.multa) msg += ` Multa generada: ${moneda(r.multa.monto)} por ${r.diasAtraso} día${r.diasAtraso === 1 ? '' : 's'} de atraso.`;
        if (r.siguienteEnCola) msg += ' Hay un asociado en la cola de espera de este libro.';
        setAviso(msg);
        cargar();
      })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setDevolviendoId(null));
  };

  return (
    <section>
      <h1 className="cat-titulo">Gestión de préstamos</h1>
      <p className="cat-conteo">Préstamos activos. Registra la devolución cuando el asociado entregue el libro.</p>

      {aviso && <p className="mensaje" style={{ color: '#1f7a48' }}>{aviso}</p>}
      {avisoError && <p className="mensaje-error">{avisoError}</p>}

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && !error && prestamos.length === 0 && (
        <div className="prest-vacio"><p className="mensaje">No hay préstamos activos.</p></div>
      )}

      {!cargando && !error && prestamos.length > 0 && (
        <table className="cat-tabla">
          <thead>
            <tr><th>Asociado</th><th>Libro</th><th>Préstamo</th><th>Vencimiento</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {prestamos.map((p) => (
              <tr key={p.id}>
                <td>{p.usuario.nombre}</td>
                <td><strong>{p.libro.titulo}</strong></td>
                <td>{fecha(p.fechaPrestamo)}</td>
                <td>
                  {fecha(p.fechaVencimiento)}
                  {p.estado === 'VENCIDO' && (
                    <div className="prest-aviso" style={{ color: '#b3261e' }}>
                      Atraso: {p.diasAtraso} día{p.diasAtraso === 1 ? '' : 's'}
                    </div>
                  )}
                </td>
                <td><EstadoPrestamo estado={p.estado} /></td>
                <td>
                  <button
                    type="button"
                    className="boton-primario"
                    style={{ padding: '6px 16px' }}
                    onClick={() => onDevolver(p)}
                    disabled={devolviendoId === p.id}
                  >
                    {devolviendoId === p.id ? 'Registrando…' : 'Registrar devolución'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

