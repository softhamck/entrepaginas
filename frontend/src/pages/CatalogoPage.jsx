import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCatalogo } from '../services/libroService';
import EstadoDisponibilidad from '../components/EstadoDisponibilidad';
import Portada from '../components/Portada';
import '../app.css';

export default function CatalogoPage() {
  const [q, setQ] = useState('');
  const [qAplicado, setQAplicado] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [disponibilidad, setDisponibilidad] = useState('todas');
  const [vista, setVista] = useState('grid');
  const [todos, setTodos] = useState([]);
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    listarCatalogo({})
      .then((datos) => { if (activo) setTodos(datos); })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    let activo = true;
    listarCatalogo({ q: qAplicado, categoria, disponibles: disponibilidad === 'disponibles' })
      .then((datos) => { if (activo) { setLibros(datos); setError(''); } })
      .catch(() => { if (activo) setError('No pudimos cargar el catálogo. Intenta de nuevo.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [qAplicado, categoria, disponibilidad]);

  const onBuscar = (e) => { e.preventDefault(); setCargando(true); setQAplicado(q); };
  const cambiar = (setter) => (e) => { setCargando(true); setter(e.target.value); };
  const limpiar = () => {
    setQ(''); setAutor(''); setCategoria(''); setDisponibilidad('todas');
    setCargando(true); setQAplicado('');
  };

  const autores = [...new Set(todos.map((l) => l.autor).filter(Boolean))].sort();
  const categorias = [...new Set(todos.map((l) => l.categoria).filter(Boolean))].sort();
  const visibles = autor ? libros.filter((l) => l.autor === autor) : libros;

  return (
    <section>
      <form className="cat-busqueda" onSubmit={onBuscar}>
        <input
          type="text"
          placeholder="Buscar por título, autor, signatura o código"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="boton-primario" type="submit">Buscar</button>
      </form>

      <div className="cat-encabezado">
        <div>
          <h1 className="cat-titulo">Catálogo</h1>
          <p className="cat-conteo">
            {todos.length} títulos · {visibles.length} resultados
            {qAplicado ? ` para "${qAplicado}"` : ''}
          </p>
        </div>
        <div className="cat-vista">
          <button type="button" className={vista === 'grid' ? 'activo' : ''} onClick={() => setVista('grid')}>Grid</button>
          <button type="button" className={vista === 'tabla' ? 'activo' : ''} onClick={() => setVista('tabla')}>Tabla</button>
        </div>
      </div>

      <div className="cat-filtros">
        <select className="cat-select" value={autor} onChange={(e) => setAutor(e.target.value)}>
          <option value="">Autor: todos</option>
          {autores.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="cat-select" value={categoria} onChange={cambiar(setCategoria)}>
          <option value="">Categoría: todas</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="cat-select" value={disponibilidad} onChange={cambiar(setDisponibilidad)}>
          <option value="todas">Disponibilidad: todas</option>
          <option value="disponibles">Solo disponibles</option>
        </select>
        <button type="button" className="cat-limpiar" onClick={limpiar}>Limpiar filtros</button>
      </div>

      {cargando && <p className="mensaje">Cargando…</p>}
      {error && <p className="mensaje-error">{error}</p>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="mensaje">No se encontraron resultados.</p>
      )}

      {!cargando && !error && visibles.length > 0 && vista === 'grid' && (
        <div className="cat-grid">
          {visibles.map((libro) => (
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
      )}

      {!cargando && !error && visibles.length > 0 && vista === 'tabla' && (
        <table className="cat-tabla">
          <thead>
            <tr><th>Título</th><th>Autor</th><th>Categoría</th><th>Estado</th><th>Ejemplares</th></tr>
          </thead>
          <tbody>
            {visibles.map((libro) => (
              <tr key={libro.id}>
                <td><Link to={`/libros/${libro.id}`} className="tabla-link">{libro.titulo}</Link></td>
                <td>{libro.autor}</td>
                <td>{libro.categoria || '—'}</td>
                <td><EstadoDisponibilidad disponible={libro.disponible} /></td>
                <td>{libro.disponibles} de {libro.ejemplares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
