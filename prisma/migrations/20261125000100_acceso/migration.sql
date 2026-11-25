ALTER TABLE "Usuario" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Dependencia" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Becario" ALTER COLUMN "semestre" DROP NOT NULL;
UPDATE "Usuario" SET "activo" = false
WHERE "rol" = 'ADMIN' AND "activo" AND "id" <> (
  SELECT "id" FROM "Usuario" WHERE "rol" = 'ADMIN' AND "activo"
  ORDER BY ("email" IS NOT DISTINCT FROM 'admin@becatrack.com') DESC, "creadoEn", "id" LIMIT 1
);
CREATE UNIQUE INDEX "Usuario_admin_activo" ON "Usuario" ("rol") WHERE "rol" = 'ADMIN' AND "activo";

