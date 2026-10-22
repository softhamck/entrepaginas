// Estado con color acompañado SIEMPRE de palabra e ícono (regla de marca).
export default function EstadoDisponibilidad({ disponible }) {
  const clase = disponible ? 'estado estado-ok' : 'estado estado-no';
  return (
    <span className={clase}>
      <span className="estado-punto" aria-hidden="true">●</span>
      {disponible ? 'Disponible' : 'No disponible'}
    </span>
  );
}