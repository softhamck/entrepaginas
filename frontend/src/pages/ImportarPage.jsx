import { useState } from 'react';
import { importarInventario } from '../services/libroService';
import '../app.css';

export default function ImportarPage() {
  const [archivo, setArchivo] = useState(null);
  const [duplicados, setDuplicados] = useState('sumar');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setReporte(null);
    if (!archivo) { setError('Selecciona un archivo Excel o CSV.'); return; }
    setCargando(true);
    try {
      const resultado = await importarInventario(archivo, duplicados);
      setReporte(resultado);
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo.');
    } finally {
      setCargando(false);
    }
  };

  const correctas = reporte ? reporte.total - (reporte.omitidos?.length ?? 0) : 0;

  return (
    <section>
      <span className="det-breadcrumb">Inventario → Importar</span>
      <h1 className="cat-titulo" style={{ marginTop: 12 }}>Importar inventario</h1>
      <p className="cat-conteo">
        Archivos .xlsx o .csv con las columnas: Título, Signatura, Código, Costo, Autor, Descripción, Categoría.
      </p>

      <form className="imp-form" onSubmit={onSubmit}>
        <div className="imp-dropzone">
          <input type="file" accept=".xlsx,.csv" onChange={(e) => setArchivo(e.target.files[0] || null)} />
          {archivo && <span className="imp-archivo">{archivo.name}</span>}
        </div>

        <label className="imp-opcion">
          Si un libro ya existe
          <select value={duplicados} onChange={(e) => setDuplicados(e.target.value)}>
            <option value="sumar">Sumar el ejemplar</option>
            <option value="omitir">Conservar el existente</option>
          </select>
        </label>

        <button className="boton-primario" type="submit" disabled={cargando}>
          {cargando ? 'Cargando…' : 'Cargar archivo'}
        </button>
      </form>

      {error && <p className="mensaje-error">{error}</p>}

      {reporte && (
        <>
          <div className="imp-tiles">
            <div className="imp-tile tile-ok"><strong>{correctas}</strong><span>Filas correctas</span></div>
            <div className="imp-tile tile-error"><strong>{reporte.omitidos?.length ?? 0}</strong><span>Filas con error</span></div>
            <div className="imp-tile"><strong>{reporte.librosNuevos}</strong><span>Títulos nuevos</span></div>
            <div className="imp-tile"><strong>{reporte.agregados}</strong><span>Ejemplares sumados</span></div>
          </div>

          {reporte.omitidos?.length > 0 && (
            <div className="imp-reporte">
              <h2 className="det-subtitulo">Filas omitidas</h2>
              <table className="cat-tabla">
                <thead><tr><th>Fila</th><th>Código</th><th>Motivo</th></tr></thead>
                <tbody>
                  {reporte.omitidos.map((o, i) => (
                    <tr key={i}>
                      <td>{o.fila}</td>
                      <td>{o.codigo || '—'}</td>
                      <td className="celda-error">{o.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
