import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ASOCIADO = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Mis préstamos', to: '/proximamente/mis-prestamos' },
  { label: 'Mi perfil', to: '/proximamente/mi-perfil' },
];

const NAV_ADMIN = [
  { label: 'Dashboard', to: '/proximamente/dashboard' },
  { label: 'Gestión de inventario', to: '/catalogo' },
  { label: 'Importar inventario', to: '/admin/importar' },
  { label: 'Gestión de préstamos', to: '/proximamente/prestamos' },
  { label: 'Colas de espera', to: '/proximamente/colas' },
  { label: 'Usuarios y multas', to: '/proximamente/usuarios' },
];

export default function Sidebar({ abierto = false, cerrar = () => {} }) {
  const { esAdmin, logout } = useAuth();
  const items = esAdmin ? NAV_ADMIN : NAV_ASOCIADO;

  return (
    <aside className={`sidebar${abierto ? ' abierta' : ''}`}>
      <div>
        <div className="sidebar-brand">entrepáginas</div>
        <div className="sidebar-sub">{esAdmin ? 'Panel bibliotecario' : 'Biblioteca FECORH'}</div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/catalogo'}
            onClick={cerrar}
            className={({ isActive }) => `sidebar-link${isActive ? ' activo' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar-salir" onClick={() => { cerrar(); logout(); }}>
        Cerrar sesión
      </button>
    </aside>
  );
}



