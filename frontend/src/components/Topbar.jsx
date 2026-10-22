import { useAuth } from '../context/AuthContext';

export default function Topbar({ onAbrirMenu = () => {} }) {
  const { esAdmin } = useAuth();
  return (
    <header className="topbar">
      <button type="button" className="menu-boton" onClick={onAbrirMenu} aria-label="Abrir menú">
        <span></span><span></span><span></span>
      </button>
      <span className="topbar-user">{esAdmin ? 'Bibliotecario' : 'Asociado'}</span>
    </header>
  );
}