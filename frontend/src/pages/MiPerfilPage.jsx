import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerRecomendaciones, actualizarConsentimiento } from '../services/recomendacionService';
import '../app.css';

export default function MiPerfilPage() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    obtenerRecomendaciones()
      .then((d) => { if (activo) setDatos(d); })
      .catch(() => { if (activo) setError('No pudimos cargar tus recomendaciones.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => cargar(), [cargar]);

  const consiente = datos ? datos.motivo !== 'sin_consentimiento' : false;

  const onToggle = () => {
    setGuardando(true);
    setError('');
    actualizarConsentimiento(usuario.id, !consiente)
      .then(() => cargar())
      .catch(() => setError('No pudimos actualizar tu preferencia.'))
      .finally(() => setGuardando(false));
  };

  return (
    <section>
      <h1 className="cat-titulo">Mi perfil</h1>
      <p className="cat-conteo">Tus preferencias y recomendaciones de lectura.</p>

      <div className="perfil-card">
        <div>
          <h2 className="det-subtitulo">Recomendaciones personalizadas</h2>
          <p className="mensaje">
            Autorizo que mi historial de lectura se use para recomendarme libros. Puedes desactivarlo cuando quieras.
          </p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={consiente} onChange={onToggle} disabled={guardando || cargando} />
          <span className="switch-slider" />
        </label>
      </div>

      <h2 className="det-subtitulo" style={{ marginTop: 28 }}>Para ti</h2>
      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && datos && (
        <>
          {!datos.habilitado && datos.motivo === 'sin_consentimiento' && (
            <p className="mensaje">Activa las recomendaciones personalizadas para ver sugerencias según lo que lees.</p>
          )}
          {!datos.habilitado && datos.motivo === 'historial_insuficiente' && (
            <p className="mensaje">Aún no tenemos suficientes datos. Sigue prestando y te recomendaremos libros afines a tus gustos.</p>
          )}
          {datos.habilitado && datos.recomendaciones.length === 0 && (
            <p className="mensaje">Por ahora no hay recomendaciones nuevas. Explora otras categorías del catálogo.</p>
          )}
          {datos.habilitado && datos.recomendaciones.length > 0 && (
            <div className="cat-grid">
              {datos.recomendaciones.map((r) => (
                <Link key={r.id} to={`/libros/${r.id}`} className="libro-card">
                  <div className="portada">portada</div>
                  <h3 className="libro-titulo">{r.titulo}</h3>
                  <p className="libro-autor">{r.autor}</p>
                  <div className="libro-fila">
                    <span className="libro-ejemplares">{r.motivo}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
