// Marcador de portada (aún no se cargan imágenes de los libros).
export default function Portada({ grande = false }) {
  return (
    <div className={grande ? 'portada portada-grande' : 'portada'} aria-hidden="true">
      <span>portada</span>
    </div>
  );
}
