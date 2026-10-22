import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../app.css';

export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="app">
      <Sidebar abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />
      <div className="main">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="contenido">
          <Outlet />
        </main>
      </div>
      {menuAbierto && <div className="overlay" onClick={() => setMenuAbierto(false)} />}
    </div>
  );
}



