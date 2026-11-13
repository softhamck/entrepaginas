import { useEffect, useState, useCallback } from 'react';
import { listarMultas, pagarMulta } from '../services/multaService';
import '../app.css';

function moneda(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function UsuariosMultasPage() {
  const [multas, setMultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagandoId, setPagandoId] = useState(null);
  const [aviso, setAviso] = useState('');
  const [avisoError, setAvisoError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    listarMultas()
      .then((datos) => { if (activo) setMultas(datos); })
      .catch(() => { if (activo) setError('No pudimos cargar las multas.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => cargar(), [cargar]);

  const onPagar = (m) => {
    setPagandoId(m.id);
    setAviso('');
    setAvisoError('');
    pagarMulta(m.id)
      .then((r) => {
        let msg = `Pago registrado: ${m.usuario.nombre}, ${moneda(m.monto)}.`;
        if (r.bloqueoLevantado) msg += ' Se levantó el bloqueo del asociado.';
        setAviso(msg);
        cargar();
      })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setPagandoId(null));
  };

  const pendientes = multas.filter((m) => !m.pagada).length;

  return (
    <section>
      <h1 className="cat-titulo">Usuarios y multas</h1>
      <p className="cat-conteo">
        {pendientes} multa{pendientes === 1 ? '' : 's'} pendiente{pendientes === 1 ? '' : 's'} de pago.
      </p>

      {aviso && <p className="mensaje" style={{ color: '#1f7a48' }}>{aviso}</p>}
      {avisoError && <p className="mensaje-error">{avisoError}</p>}

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && !error && multas.length === 0 && (
        <div className="prest-vacio"><p className="mensaje">No hay multas registradas.</p></div>
      )}

      {!cargando && !error && multas.length > 0 && (
        <table className="cat-tabla">
          <thead>
            <tr><th>Asociado</th><th>Libro</th><th>Valor</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {multas.map((m) => (
              <tr key={m.id}>
                <td>{m.usuario.nombre}</td>
                <td>{m.libro.titulo}</td>
                <td>{moneda(m.monto)}</td>
                <td>
                  <span className={`estado ${m.pagada ? 'estado-ok' : 'estado-no'}`}>
                    <span className="estado-punto" aria-hidden="true">●</span>{m.pagada ? 'Pagada' : 'Pendiente'}
                  </span>
                </td>
                <td>
                  {m.pagada ? '—' : (
                    <button
                      type="button"
                      className="boton-primario"
                      style={{ padding: '6px 16px' }}
                      onClick={() => onPagar(m)}
                      disabled={pagandoId === m.id}
                    >
                      {pagandoId === m.id ? 'Registrando…' : 'Marcar como pagada'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
