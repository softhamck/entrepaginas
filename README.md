# EntrePáginas

Sistema de préstamos de biblioteca para la alianza Asociados Fecorh–Comfama.

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL (Neon)
- Frontend: React (Vite) + react-router-dom
- Autenticación: JWT + bcrypt

## Requisitos previos
- Node.js 18 o superior
- Git
- Una base de datos PostgreSQL (recomendado: [Neon](https://neon.tech), plan gratuito)

## Cómo levantar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Completar `.env` :
```
DATABASE_URL=""
JWT_SECRET=
```

Genera el cliente de Prisma y aplica las migraciones:
```bash
npx prisma generate
npx prisma migrate dev
```

(Opcional) Crear los usuarios de prueba:
```bash
npx prisma db seed
```

Levantar el servidor:
```bash
npm run dev
```
Debe quedar corriendo en `http://localhost:3000`.

## Cómo levantar el frontend

```bash
cd frontend
npm install
```

Crear `frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```

Levantar la app:
```bash
npm run dev
```
Debe abrir en `http://localhost:5173`.

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registra un nuevo usuario |
| POST | `/api/auth/login` | Autentica y devuelve un JWT |

## Ver la base de datos visualmente
```bash
cd backend
npx prisma studio
```
Abre en `http://localhost:5555`.

## Ramas y flujo de trabajo
- `main`: Rama estable, solo recibe merge desde `develop` al cerrar un release.
- `develop`: Rama de integración, todo el trabajo del sprint llega aquí.
- `feature/HU-XX-descripcion`: Una rama por historia, con Pull Request obligatorio hacia `develop` (mínimo 1 aprobación de otro integrante).
