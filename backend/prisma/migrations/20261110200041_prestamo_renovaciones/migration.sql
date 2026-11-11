-- HU-13: contador de renovaciones por préstamo (regla: solo una renovación)
ALTER TABLE "Prestamo" ADD COLUMN "renovaciones" INTEGER NOT NULL DEFAULT 0;
