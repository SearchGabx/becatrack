# CONTEXT-AGENT.md — Contexto Completo de Sesión (BECATRACK · CUC)

**Fecha de corte:** 2026-11-25  
**Proyecto:** `C:\Users\sebas\Downloads\becatrack` (clonado de `https://github.com/SearchGabx/becatrack.git`, rama local `develop`)  
**Propósito:** Documento de traspaso con toda la arquitectura, decisiones tomadas, estado actual de archivos, bases de datos y plan pendiente aprobado/por confirmar hasta antes de la creación de este archivo.

---

## 1. Resumen Ejecutivo de la Sesión

1. **Decisión de Base de Datos:** Se eligió base de datos **relacional PostgreSQL 16** (Neon en desarrollo local / Vercel, Amazon RDS en producción AWS Academy).
2. **Cambio de Stack (Vite → Next.js 15):**
   * Inicialmente se exploró clonar Atomic CRM (Vite), pero se descartó por completo para cumplir estrictamente la guía PDF (*BECATRACK: guía paso a paso del SaaS de becarios*) y la rúbrica de evaluación.
   * Se clonó el repositorio oficial del equipo (`https://github.com/SearchGabx/becatrack.git`) en `C:\Users\sebas\Downloads\becatrack`, se alineó la rama `develop` con `main` (`c8c3e2a`) y se construyó **BECATRACK 100% en Next.js 15 (`15.5.29`, App Router) + React 19 + TypeScript + Prisma 6 + Auth.js v5 + Tailwind CSS v4**.
   * **No se ha hecho `git push`** al repositorio remoto: todos los cambios están únicamente en local para revisión y distribución de ramas/PRs por el equipo.
3. **Manual Normativo de Marca CUC:**
   * Tipografía oficial: `Red_Hat_Display` (`next/font/google`) en `src/app/layout.tsx`.
   * Paleta institucional en `src/app/globals.css`: Auburn `#A3161A`, Satin Sheen Gold `#C9A227`, Gold `#FCD116`, Forest Green `#078930`, Davy's Gray `#595959`, Silver Dark `#A5A5A5`, Silver `#CCCCCC`.
   * Imagotipo, isotipo y cobranding CUC en `src/components/ui/CucLogo.tsx`.
4. **Integración del Módulo Existente de Horarios (`horario-app`):**
   * Se inspeccionó el clon local `C:\Users\sebas\Downloads\horario-app` (remoto `https://github.com/jugotoptea-a11y/horario-app.git`).
   * Se integraron sus modelos (`Student`, `Schedule`), Server Actions (`src/modules/horario/actions.ts`), estilos encapsulados (`src/modules/horario/horario.css`) y componentes (`src/modules/horario/components/*`) dentro de `/dashboard/horario` y `/dashboard/horario/gestion`, protegidos con `requireModule('horario')` (solo `ADMIN`).
5. **Limpieza y Separación de Bases de Datos Neon:**
   * Temporalmente se conectó BECATRACK al Neon de `horario-app` (`ep-bitter-paper-aczf1svl-pooler.sa-east-1.aws.neon.tech`) para verificar Auth y el módulo de horarios.
   * A solicitud del usuario, **se limpiaron las 8 tablas y 3 enums de BECATRACK** de ese Neon, dejándolo intacto con únicamente sus **2 tablas originales**: `Student` (**105** registros) y `Schedule` (**493** registros).
   * Se desvinculó `C:\Users\sebas\Downloads\becatrack\.env` dejándolo con plantilla para conectar un **nuevo proyecto Neon dedicado exclusivamente a BECATRACK (10 tablas)**.

---

## 2. Stack Tecnológico e Infraestructura

| Capa | Tecnología / Versión | Notas |
| :--- | :--- | :--- |
| Framework | Next.js `15.5.29` (App Router) + React `19.1.0` + TypeScript `^5` | `serverExternalPackages: ['pdf-parse']` en `next.config.ts` |
| Estilos | Tailwind CSS v4 + CSS modular en `src/modules/horario/horario.css` | Paleta CUC + fuente `Red Hat Display` |
| ORM / BD | Prisma `^6.4.1` + `@prisma/client` + PostgreSQL 16 | Neon en local/Vercel; Amazon RDS (`db.t3.micro`) en AWS Academy |
| Autenticación | `next-auth` `5.0.0-beta.25` (Auth.js v5) + `bcryptjs` | JWT (8 horas), Edge Middleware + Server Guards |
| Validación / Extras | `zod`, `lucide-react`, `csv-parse`, `pdf-parse`, `xlsx` | Validación en Server Actions + carga CSV/PDF y exportación Excel |
| Pruebas y Calidad | Vitest `^3.0.7`, ESLint `^9`, `eslint-config-next` `15.5.29`, Prettier, Commitlint | `tests/permissions.test.ts` (4 tests) y `tests/semaforo.test.ts` (3 tests) |
| Despliegue / CI | Node.js 20 + PM2 + Nginx/Certbot + GitHub Actions | `.github/workflows/ci.yml` (`lint`, `test`, `build`) y `deploy.yml` (EC2 SSH + PM2) |

---

## 3. Estructura Actual de Archivos Clave en `C:\Users\sebas\Downloads\becatrack`

* **Raíz e Infraestructura:**
  * `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `commitlint.config.mjs`, `.prettierrc`
  * `.env.example`, `.env`, `README.md`
  * `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/pull_request_template.md`, `.github/CODEOWNERS`
* **Base de Datos (`prisma/`):**
  * `prisma/schema.prisma` — 10 modelos (`Usuario`, `Becario`, `Seguimiento`, `Dependencia`, `RegistroHoras`, `Evento`, `AsignacionStaff`, `Tarea`, `Student`, `Schedule`) y 3 enums (`Rol`, `EstadoRegistro`, `EstadoTarea`).
  * `prisma/migrations/20261125000000_init/migration.sql` — Migración SQL inicial con las 10 tablas.
  * `prisma/seed.ts` — Seed actual (pendiente de actualizar según el `/plan` de la sección 6).
* **Autenticación y Permisos (`src/`):**
  * `src/lib/permissions.ts` — Matriz única de verdad (`ADMIN`: 8 módulos; `BECARIO`: `conteoHoras`, `asistencia`, `staff`; `DEPENDENCIA`: `registroHoras`).
  * `src/lib/guards.ts` — `requireModule(modulo)`.
  * `src/lib/db.ts` — Singleton `PrismaClient`.
  * `src/auth.config.ts`, `src/auth.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`.
* **Rutas App Router (`src/app/`):**
  * `src/app/page.tsx` — Landing pública con cobranding CUC.
  * `src/app/login/page.tsx` + `src/app/login/actions.ts` — Login con `useActionState`.
  * `src/app/(dashboard)/layout.tsx` + `src/app/(dashboard)/dashboard/page.tsx` — Layout con `Sidebar.tsx` filtrado por rol.
  * `src/app/(dashboard)/dashboard/crm/page.tsx` + `[id]/page.tsx` + `FormBecario.tsx`
  * `src/app/(dashboard)/dashboard/conteo-horas/page.tsx`
  * `src/app/(dashboard)/dashboard/registro-horas/page.tsx` + `FormRegistro.tsx`
  * `src/app/(dashboard)/dashboard/dependencias/page.tsx` + `FormDependencia.tsx`
  * `src/app/(dashboard)/dashboard/staff/page.tsx` + `FormStaff.tsx`
  * `src/app/(dashboard)/dashboard/tareas/page.tsx` + `FormTarea.tsx`
  * `src/app/(dashboard)/dashboard/horario/page.tsx` + `gestion/page.tsx` (módulo integrado de `horario-app`).
  * `src/app/(dashboard)/dashboard/asistencia/page.tsx` (placeholder protegido).
* **Módulos de Lógica (`src/modules/`):**
  * `crm/actions.ts`, `dependencias/actions.ts`, `horas/actions.ts`, `horas/queries.ts`, `staff/actions.ts`, `tareas/actions.ts`, `tareas/semaforo.ts`
  * `horario/actions.ts`, `horario/constants.ts`, `horario/horario.css`, `horario/components/*` (`HorarioWorkspace.tsx`, `SearchFilters.tsx`, `AvailableStudentsTable.tsx`, `WeeklyTimetable.tsx`, `StudentScheduleModal.tsx`, `CsvUploadPanel.tsx`, `PdfUploadPanel.tsx`).

---

## 4. Estado de Validaciones Ejecutadas

* `npm test`: **7/7 pruebas pasando** (`tests/permissions.test.ts` y `tests/semaforo.test.ts`).
* `npm run lint`: **0 errores, 0 warnings** (`next lint`).
* `npm run build`: **Compilación exitosa** (`prisma generate && next build`, 15 rutas + Middleware `85.4 kB`).
* **Estado del Neon de `horario-app` (`ep-bitter-paper-aczf1svl-pooler.sa-east-1.aws.neon.tech`):**
  * Limpiado y verificado: solo contiene `Student` (`105` filas) y `Schedule` (`493` filas), `0` enums.
  * Todos los 105 estudiantes tienen `correo` `@cuc.edu.co` único (`0` faltantes, `0` duplicados), distribuidos en promociones `2022` (16), `2023` (18), `2024` (24), `2025` (24) y `2026` (23).

---

## 5. Despliegue: Local, Vercel y AWS Academy

* **Desarrollo Local:** Cada integrante usa su Neon gratuito en `.env` (`.env` está en `.gitignore`).
* **Vercel:** Variables requeridas en Vercel: `DATABASE_URL` (del nuevo Neon dedicado), `AUTH_SECRET`, `AUTH_TRUST_HOST=true`. Se recomienda agregar `experimental: { serverActions: { bodySizeLimit: '10mb' } }` en `next.config.ts` para subidas de múltiples PDFs en Horarios.
* **AWS Academy (Rúbrica Criterio 9):** En AWS EC2 se crea `~/becatrack/.env` apuntando a **Amazon RDS PostgreSQL 16 (`db.t3.micro`)** dentro de la VPC (`sg-db` solo puerto `5432` desde `sg-web`), detrás de **Nginx + Certbot** (puertos `80`/`443` SSL). El despliegue ejecuta `npx prisma migrate deploy`, `npm run build` y administra el proceso con **PM2** (`next start` en el puerto `3000`).

---

## 6. Plan en Curso (`/plan` Pendiente de Confirmación y Ejecución)

Justo antes de crear este archivo se generó el plan en `implementation_plan.md` (aún **no ejecutado**, esperando confirmación del usuario) con los siguientes requerimientos:

1. **Snapshot local de datos reales:** Exportar en solo lectura los **105 estudiantes (`Student`)** y **493 horarios (`Schedule`)** desde el Neon de `horario-app` hacia `prisma/data/becarios_horarios.json` para poblar el nuevo Neon dedicado de BECATRACK (`Usuario` + `Becario` + `Student` + `Schedule`).
2. **Admin único:** `user: admin` / `password: Opcion2026` (requiere agregar `username String @unique` en `Usuario`, cambiar `LoginSchema` de email estricto a identificador `username` o `email`, y eliminar botones/contraseñas demo de `/login`).
3. **70 Dependencias reales CUC:** Cargar la lista exacta de las 70 dependencias proporcionada por el usuario (incluyendo pares con variación ortográfica como `Michell Murillo` / `Michel Murillo`, `Yulineth Gomez` / `Yulineth Gómez`, `Natalia González Auque` / `Natalia Gonzalez`) con sus cuentas `Usuario` (`rol: DEPENDENCIA`).
4. **Preguntas abiertas pendientes de respuesta del usuario:**
   * Confirmar si la contraseña compartida de las 70 dependencias es `Opcion2026`.
   * Confirmar si la contraseña inicial de los 105 becarios es su número de `documento` (como indica el Paso 5.6 de la guía PDF) y acceso por `correo` `@cuc.edu.co` o `documento`.
   * Confirmar la eliminación de las tarjetas de autocompletado en `/login`.
