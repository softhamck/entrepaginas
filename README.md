# EntrePáginas

Sistema de préstamos de biblioteca para la alianza Asociados Fecorh–Comfama.

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React (Vite)
- Autenticación: JWT + bcrypt

## Cómo levantar el backend
```bash
cd backend
npm install
cp .env.example .env   # completar DATABASE_URL y JWT_SECRET
npx prisma migrate dev
npm run dev
```

## Cómo levantar el frontend
```bash
cd frontend
npm install
npm run dev
```
