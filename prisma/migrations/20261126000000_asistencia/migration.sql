-- CreateEnum
CREATE TYPE "TipoEscaneo" AS ENUM ('INICIO', 'FIN');

-- CreateTable
CREATE TABLE "Reunion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escaneo" (
    "id" TEXT NOT NULL,
    "reunionId" TEXT NOT NULL,
    "becarioId" TEXT NOT NULL,
    "tipo" "TipoEscaneo" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escaneo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Escaneo_becarioId_idx" ON "Escaneo"("becarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Escaneo_reunionId_becarioId_tipo_key" ON "Escaneo"("reunionId", "becarioId", "tipo");

-- AddForeignKey
ALTER TABLE "Escaneo" ADD CONSTRAINT "Escaneo_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escaneo" ADD CONSTRAINT "Escaneo_becarioId_fkey" FOREIGN KEY ("becarioId") REFERENCES "Becario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
