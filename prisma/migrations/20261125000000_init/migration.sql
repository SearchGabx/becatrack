-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'BECARIO', 'DEPENDENCIA');

-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Becario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "programa" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "telefono" TEXT,
    "horasRequeridas" INTEGER NOT NULL DEFAULT 100,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Becario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seguimiento" (
    "id" TEXT NOT NULL,
    "becarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" TEXT,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroHoras" (
    "id" TEXT NOT NULL,
    "becarioId" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horas" DECIMAL(4,1) NOT NULL,
    "actividad" TEXT NOT NULL,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "cupos" INTEGER NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionStaff" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "becarioId" TEXT NOT NULL,
    "funcion" TEXT NOT NULL,
    "horas" DECIMAL(4,1) NOT NULL DEFAULT 0,

    CONSTRAINT "AsignacionStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "becarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Módulo Horario y Disponibilidad)
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "nombre_norm" TEXT NOT NULL,
    "promo" TEXT,
    "correo" TEXT,
    "contacto" TEXT,
    "municipio" TEXT,
    "programa" TEXT,
    "actualizado_en" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Módulo Horario y Disponibilidad)
CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "promocion" TEXT,
    "periodo" TEXT,
    "dia" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "hora_inicio_min" INTEGER NOT NULL,
    "hora_fin_min" INTEGER NOT NULL,
    "prog" TEXT,
    "codigo_clase" TEXT,
    "materia" TEXT NOT NULL,
    "docente" TEXT,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Becario_usuarioId_key" ON "Becario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Becario_documento_key" ON "Becario"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_nombre_key" ON "Dependencia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_usuarioId_key" ON "Dependencia"("usuarioId");

-- CreateIndex
CREATE INDEX "RegistroHoras_becarioId_idx" ON "RegistroHoras"("becarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionStaff_eventoId_becarioId_key" ON "AsignacionStaff"("eventoId", "becarioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Student_nombre_norm_idx" ON "Student"("nombre_norm");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Schedule_studentId_idx" ON "Schedule"("studentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Schedule_dia_hora_inicio_min_hora_fin_min_idx" ON "Schedule"("dia", "hora_inicio_min", "hora_fin_min");

-- AddForeignKey
ALTER TABLE "Becario" ADD CONSTRAINT "Becario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seguimiento" ADD CONSTRAINT "Seguimiento_becarioId_fkey" FOREIGN KEY ("becarioId") REFERENCES "Becario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependencia" ADD CONSTRAINT "Dependencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroHoras" ADD CONSTRAINT "RegistroHoras_becarioId_fkey" FOREIGN KEY ("becarioId") REFERENCES "Becario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroHoras" ADD CONSTRAINT "RegistroHoras_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionStaff" ADD CONSTRAINT "AsignacionStaff_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionStaff" ADD CONSTRAINT "AsignacionStaff_becarioId_fkey" FOREIGN KEY ("becarioId") REFERENCES "Becario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_becarioId_fkey" FOREIGN KEY ("becarioId") REFERENCES "Becario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
