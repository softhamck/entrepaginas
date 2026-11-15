import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerDetalle, actualizarLibro, obtenerEjemplares, darBajaEjemplar } from '../services/libroService';
import { solicitarPrestamo } from '../services/prestamoService';
import { crearReserva } from '../services/reservaService';
import { useAuth } from '../context/AuthContext';
import EstadoDisponibilidad from '../components/EstadoDisponibilidad';
import Portada from '../components/Portada';
import '../app.css';

const CAMPOS = [
  { name: 'titulo', label: 'Título' },
  { name: 'autor', label: 'Autor' },
  { name: 'categoria', label: 'Categoría' },
  { name: 'signatura', label: 'Signatura' },
];

export default function DetalleLibroPage() {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const [libro, setLibro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Asociado
  const [solicitando, setSolicitando] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [avisoError, setAvisoError] = useState('');

  // Admin
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ titulo: '', autor: '', categoria: '', signatura: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [ejemplares, setEjemplares] = useState([]);
  const [bajaId, setBajaId] = useState(null);
  const [avisoAdmin, setAvisoAdmin] = useState('');
  const [avisoAdminError, setAvisoAdminError] = useState('');

  const cargar = useCallback(() => {
    let activo = true;
    obtenerDetalle(id)
      .then((datos) => {
        if (!activo) return;
        setLibro(datos);
        setForm({
          titulo: datos.titulo || '', autor: datos.autor || '',
          categoria: datos.categoria || '', signatura: datos.signatura || '',
          descripcion: datos.descripcion || '',
        });
      })
      .catch((err) => {
        if (activo) setError(err.message === 'LIBRO_NO_ENCONTRADO' ? 'Libro no encontrado.' : 'No pudimos cargar el libro.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id]);

  useEffect(() => cargar(), [cargar]);

  const cargarEjemplares = useCallback(() => {
    obtenerEjemplares(id).then(setEjemplares).catch(() => {});
  }, [id]);

  useEffect(() => { if (esAdmin) cargarEjemplares(); }, [esAdmin, cargarEjemplares]);

  const onSolicitar = () => {
    setSolicitando(true); setAviso(''); setAvisoError('');
    solicitarPrestamo(Number(id))
      .then(() => { setAviso('Préstamo registrado. Tienes 14 días para devolverlo.'); cargar(); })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setSolicitando(false));
  };

  const onReservar = () => {
    setReservando(true); setAviso(''); setAvisoError('');
    crearReserva(Number(id))
      .then((r) => { setAviso(`Estás en la lista de espera. Tu posición es la #${r.posicion}. Te avisaremos cuando esté disponible.`); })
      .catch((err) => setAvisoError(err.message))
      .finally(() => setReservando(false));
  };

  const setCampo = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const onGuardar = () => {
    setGuardando(true); setAvisoAdmin(''); setAvisoAdminError('');
    actualizarLibro(Number(id), form)
      .then(() => { setAvisoAdmin('Cambios guardados.'); setEditando(false); cargar(); })
      .catch((err) => setAvisoAdminError(err.message))
      .finally(() => setGuardando(false));
  };

  const onDarBaja = (ej) => {
    setBajaId(ej.id); setAvisoAdmin(''); setAvisoAdminError('');
    darBajaEjemplar(ej.id)
      .then((r) => {
        setAvisoAdmin(r.accion === 'ELIMINADO'
          ? `Ejemplar ${ej.codigo} eliminado (no tenía historial de préstamos).`
          : `Ejemplar ${ej.codigo} dado de baja.`);
        cargarEjemplares(); cargar();
      })
      .catch((err) => setAvisoAdminError(err.message))
      .finally(() => setBajaId(null));
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

            {/* ===== Acciones del asociado ===== */}
            {!esAdmin && (
              <>
                <div className="det-acciones">
                  <button className="boton-primario" type="button" onClick={onSolicitar} disabled={!libro.disponible || solicitando}>
                    {solicitando ? 'Solicitando…' : 'Solicitar préstamo'}
                  </button>
                  <button className="boton-secundario" type="button" onClick={onReservar} disabled={libro.disponible || reservando}>
                    {reservando ? 'Uniéndote…' : 'Unirme a cola de espera'}
                  </button>
                </div>
                {aviso && <p className="mensaje" style={{ color: '#1f7a48', marginTop: 10 }}>{aviso}</p>}
                {avisoError && <p className="mensaje-error" style={{ marginTop: 10 }}>{avisoError}</p>}
                {!libro.disponible && !aviso && (
                  <p className="det-nota">No hay ejemplares disponibles. Únete a la cola y te avisaremos cuando se libere uno.</p>
                )}
              </>
            )}

            {/* ===== Gestión de inventario (admin, HU-10) ===== */}
            {esAdmin && (
              <div className="admin-panel">
                {!editando ? (
                  <button className="boton-secundario" type="button" onClick={() => { setEditando(true); setAvisoAdmin(''); setAvisoAdminError(''); }}>
                    Editar libro
                  </button>
                ) : (
                  <div className="admin-form">
                    {CAMPOS.map((c) => (
                      <label key={c.name} className="admin-campo">
                        {c.label}
                        <input value={form[c.name]} onChange={(e) => setCampo(c.name, e.target.value)} />
                      </label>
                    ))}
                    <label className="admin-campo">
                      Descripción
                      <textarea rows="3" value={form.descripcion} onChange={(e) => setCampo('descripcion', e.target.value)} />
                    </label>
                    <div className="det-acciones">
                      <button className="boton-primario" type="button" onClick={onGuardar} disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button className="boton-secundario" type="button" onClick={() => { setEditando(false); setAvisoAdminError(''); }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <h2 className="det-subtitulo" style={{ marginTop: 22 }}>Ejemplares</h2>
                {ejemplares.length === 0 ? (
                  <p className="mensaje">Este libro no tiene ejemplares registrados.</p>
                ) : (
                  <table className="cat-tabla">
                    <thead><tr><th>Código</th><th>Estado</th><th></th></tr></thead>
                    <tbody>
                      {ejemplares.map((ej) => (
                        <tr key={ej.id}>
                          <td>{ej.codigo}</td>
                          <td>{ej.estado}</td>
                          <td>
                            <button
                              type="button"
                              className="boton-secundario"
                              style={{ padding: '6px 16px' }}
                              onClick={() => onDarBaja(ej)}
                              disabled={bajaId === ej.id || ej.estado === 'BAJA'}
                            >
                              {ej.estado === 'BAJA' ? 'Dado de baja' : (bajaId === ej.id ? 'Procesando…' : 'Dar de baja')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {avisoAdmin && <p className="mensaje" style={{ color: '#1f7a48', marginTop: 10 }}>{avisoAdmin}</p>}
                {avisoAdminError && <p className="mensaje-error" style={{ marginTop: 10 }}>{avisoAdminError}</p>}
              </div>
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
