-- DropIndex
DROP INDEX "Libro_isbn_key";

-- AlterTable
ALTER TABLE "Libro" DROP COLUMN "isbn",
DROP COLUMN "sinopsis",
ADD COLUMN "signatura" TEXT,
ADD COLUMN "categoria" TEXT,
ADD COLUMN "descripcion" TEXT;

-- AlterTable
ALTER TABLE "Ejemplar" ADD COLUMN "codigo" TEXT NOT NULL,
ADD COLUMN "costo" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Ejemplar_codigo_key" ON "Ejemplar"("codigo");
