import { useEffect, useState } from 'react';
import { obtenerBloqueo } from '../services/multaService';
import '../app.css';

// Banner que avisa al asociado que está bloqueado por multa (HU-17).
export default function BannerBloqueo({ usuarioId }) {
  const [bloqueo, setBloqueo] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerBloqueo(usuarioId)
      .then((b) => { if (activo) setBloqueo(b); })
      .catch(() => { /* si falla, simplemente no mostramos el banner */ });
    return () => { activo = false; };
  }, [usuarioId]);

  if (!bloqueo || !bloqueo.bloqueado) return null;

  const n = bloqueo.multasPendientes;
  return (
    <div className="banner-bloqueo">
      <span className="banner-bloqueo-icono" aria-hidden="true">●</span>
      <span>
        Tienes {n} multa{n === 1 ? '' : 's'} pendiente{n === 1 ? '' : 's'}. No puedes solicitar préstamos
        ni reservas hasta ponerte al día. Acércate a la biblioteca para pagar y reactivar tu cuenta.
      </span>
    </div>
  );
}
