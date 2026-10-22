import { useState } from 'react';
import { register } from '../services/authService';
import './auth.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', contrasena: '' });
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      setExito(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (exito) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="login-brand-panel">
            <div>
              <div className="login-logo">entrepáginas</div>
              <p className="login-eyebrow">BIBLIOTECA DE FECORH</p>
              <p className="login-tagline">Tu cuenta quedó lista. Inicia sesión para explorar el catálogo.</p>
            </div>
            <div className="login-brand-footer">
              <span className="login-brand-dot" />
              Fondo de Empleados de Coninsa S.A.S.
            </div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-logo">entrepáginas</div>
            <h1>¡Cuenta creada!</h1>
            <p className="auth-subtext">
              Ya puedes iniciar sesión con tu correo y tu contraseña, con rol
              <strong className="auth-highlight"> Usuario</strong>.
            </p>
            <a href="/login" className="auth-button auth-button-link">Iniciar sesión</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-form-panel">
          <div className="auth-logo">entrepáginas</div>
          <h1>Crear cuenta</h1>
          <p className="auth-subtext">
            Tu cuenta se crea con rol <strong className="auth-highlight">Usuario</strong>.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Nombre completo
              <input name="nombre" placeholder="Ana María Ríos" onChange={handleChange} required />
            </label>
            <label>
              Correo electrónico
              <input name="correo" type="email" placeholder="ana.rios@coninsa.co" onChange={handleChange} required />
            </label>
            <label>
              Teléfono
              <input name="telefono" placeholder="+57 300 214 8890" onChange={handleChange} required />
            </label>
            <label>
              Contraseña
              <input name="contrasena" type="password" placeholder="••••••••••" onChange={handleChange} required minLength={8} />
              <span className="auth-hint">Mínimo 8 caracteres.</span>
            </label>
            <button type="submit" className="auth-button">Crear cuenta</button>
          </form>

          <p className="auth-footer">
            Ya tengo cuenta · <a href="/login" className="auth-link">Iniciar sesión</a>
          </p>
        </div>

        <div className="auth-rules-panel">
          <p className="auth-rules-title">REGLAS DE LA CUENTA</p>
          <ul className="auth-rules-list">
            <li>El correo debe ser único en el sistema.</li>
            <li>Hasta 3 préstamos simultáneos por usuario.</li>
            <li>Préstamos de 14 días, renovables una vez.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
