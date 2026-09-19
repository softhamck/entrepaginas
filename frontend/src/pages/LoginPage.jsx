import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginPage() {
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.correo.trim() || !form.contrasena) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }

    setCargando(true);
    try {
      const { token } = await loginRequest(form);
      login(token);
      navigate('/catalogo');
    } catch (err) {
      if (err.message === 'SERVICIO_NO_DISPONIBLE') {
        setError('El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.');
      } else {
        // Mensaje genérico: no revela si el correo existe (HU-04)
        setError('Correo o contraseña incorrectos.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="login-brand-panel">
          <div>
            <div className="login-logo">entrepáginas</div>
            <p className="login-eyebrow">BIBLIOTECA DE FECORH</p>
            <p className="login-tagline">
              Consulta el catálogo, solicita préstamos y sigue tus devoluciones desde un solo lugar.
            </p>
          </div>
          <div className="login-brand-footer">
            <span className="login-brand-dot" />
            Fondo de Empleados de Coninsa S.A.S.
          </div>
        </div>

        <div className="auth-form-panel login-form-panel">
          <h1>Iniciar sesión</h1>
          <p className="auth-subtext">Accede con tu correo y contraseña.</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label>
              Correo electrónico
              <input
                name="correo"
                type="email"
                autoComplete="email"
                placeholder="ana.rios@coninsa.co"
                value={form.correo}
                onChange={handleChange}
              />
            </label>
            <label>
              Contraseña
              <input
                name="contrasena"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={form.contrasena}
                onChange={handleChange}
              />
            </label>
            <button type="submit" className="auth-button" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? · <a href="/registro" className="auth-link">Crear cuenta</a>
          </p>
        </div>
      </div>
    </div>
  );
}
