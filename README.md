# BECATRACK: SaaS de Gestión de Becarios CUC

![CI](https://github.com/SearchGabx/becatrack/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/SearchGabx/becatrack/actions/workflows/deploy.yml/badge.svg)

**BECATRACK** es un SaaS de gestión de becarios de la **Universidad de la Costa (CUC)** construido en **Next.js 15 (App Router) + React 19 + TypeScript + Prisma 6 + Auth.js v5** sobre **PostgreSQL 16** (Neon en desarrollo local y Amazon RDS en producción), con tres roles (**ADMIN**, **BECARIO**, **DEPENDENCIA**), diseño inspirado en **Atomic CRM** aplicando el **Manual Normativo de Marca CUC**, empaquetado en **Docker** y desplegado en **AWS Academy** con **Caddy HTTPS** y **CI/CD en GitHub Actions**.

🌐 **Dominio público:** [https://becatrack.tech](https://becatrack.tech)

---

## 2. Capturas por Rol (`docs/img/`)

* `docs/img/01-landing.png` — Landing page pública con cobranding institucional CUC (`/`).
* `docs/img/02-login.png` — Login obligatorio validado con Auth.js v5 y Zod (`/login`).
* `docs/img/03-admin-crm.png` — Vista **ADMIN** (CRM de becarios, dependencias, aprobación de horas, staff y tareas en semáforo).
* `docs/img/04-becario-horas.png` — Vista **BECARIO** (`Conteo de horas`, `Asistencia y QR`, `Mis asignaciones de Staff`).
* `docs/img/05-dependencia-registro.png` — Vista **DEPENDENCIA** (`Registro de horas sociales`).

---

## 3. Getting Started

### Requisitos
* **Node.js 20 LTS** o superior, **Git**, **VS Code** y una cuenta gratuita en **Neon** ([neon.tech](https://neon.tech)) con PostgreSQL 16 (región `AWS US East / N. Virginia`).

### Instalación paso a paso

```bash
git clone https://github.com/SearchGabx/becatrack.git
cd becatrack
git checkout develop
cp .env.example .env      # pegar en DATABASE_URL la conexión directa de Neon (?sslmode=require)
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Cuentas y carga de datos

Para ejecutar `npm run db:seed`, configura `DATABASE_URL` con la base de destino, `HORARIO_DATABASE_URL` con la fuente de horario-app y `BECATRACK_ADMIN_PASSWORD` con la clave del administrador. La carga puede repetirse. Informa cuántos becarios necesitan corregir su correo. Sus fichas y horarios se conservan.

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administración | admin | Clave configurada |
| Becario | Correo del padrón | Documento completo |
| Dependencia | Correo registrado | Clave inicial asignada o la definida por administración |

---

## 4. Build y Despliegue con Docker y GitHub Actions

```bash
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npm test         # Pruebas unitarias Vitest (permisos y semáforo)
npm run build    # prisma generate && next build (genera .next/standalone)
```

* **Imagen Docker (`Dockerfile`):** Construcción en 3 etapas (`deps`, `build`, `runner`) sobre `node:20-alpine`. Aprovecha `output: 'standalone'` de `next.config.ts` para copiar únicamente `.next/standalone`, `.next/static`, `public` y `prisma`. Al iniciar ejecuta `prisma migrate deploy && node server.js` en el puerto interno `3000`.
* **Workflow de Despliegue (`.github/workflows/deploy.yml`):** Se dispara en cada push/merge a `main`:
  1. `build-image`: Construye la imagen Docker y la publica en **GitHub Container Registry (GHCR)** como `ghcr.io/searchgabx/becatrack:latest`.
  2. `deploy`: Copia `docker-compose.yml` y `Caddyfile` por SCP a la instancia EC2 de AWS Academy y actualiza los contenedores por SSH (`docker compose pull app && docker compose up -d`).

---

## 5. Arquitectura en AWS Academy (Criterio 9)

```mermaid
flowchart TD
    U["Usuario (Navegador)"] -->|HTTPS 443| DNS["Dominio Propio (.tech / name.com)<br/>Registro A -> Elastic IP"]
    DNS --> EIP["AWS Elastic IP"]
    subgraph AWS["AWS Academy · VPC us-east-1"]
        subgraph EC2["EC2 t3.small (Amazon Linux 2023 · sg-web: 80, 443, 22)"]
            CADDY["Caddy 2 (Contenedor)<br/>Puertos 80 y 443 · SSL Let's Encrypt"] -->|reverse_proxy app:3000| APP["Next.js 15 en Docker<br/>Puerto 3000 interno · Login, roles y módulos"]
        end
        APP -->|Puerto 5432 interno| RDS[("RDS PostgreSQL 16 (db.t3.micro)<br/>Sin acceso público<br/>sg-db: solo 5432 desde sg-web")]
    end
    GH["GitHub Actions (ci.yml & deploy.yml)"] -->|build-image| GHCR["GHCR (ghcr.io/searchgabx/becatrack:latest)"]
    GH -->|SSH / SCP :22| EC2
    GHCR -->|docker compose pull| EC2
```

### Servicios de Infraestructura y Justificación

| Componente | Servicio | Función y justificación (Criterio 9) |
| :--- | :--- | :--- |
| **Dominio y DNS** | `name.com` o `get.tech` (GitHub Student Pack) | Registro `A` (`@` y `www`) del dominio apuntando a la Elastic IP. |
| **IP fija** | Elastic IP | La IP pública no cambia cuando el Learner Lab se apaga y se vuelve a encender. |
| **Firewall de la app** | Security Group `sg-web` | Abre `80` y `443` al público y `22` para el despliegue por SSH desde GitHub Actions. |
| **Servidor** | EC2 `t3.small`, Amazon Linux 2023, Docker | Corre Caddy y el contenedor standalone de Next.js 15. |
| **Proxy y HTTPS** | Caddy 2 (contenedor) | Recibe el dominio, emite el certificado SSL de Let's Encrypt y reenvía a `app:3000`; así no se expone IP ni puerto interno. |
| **Aplicación** | Contenedor Next.js 15 (puerto `3000` interno) | Páginas SSR, autenticación Auth.js v5 y Server Actions. |
| **Base de datos** | RDS PostgreSQL 16, `db.t3.micro`, sin acceso público | Datos relacionales persistentes con backups administrados dentro de la VPC. |
| **Firewall de la BD** | Security Group `sg-db` | Solo acepta conexiones en el puerto `5432` cuyo origen sea `sg-web`. |
| **Registro de imágenes** | GitHub Container Registry (GHCR) | Almacena la imagen Docker que construye GitHub Actions. |
| **CI/CD** | GitHub Actions | `ci.yml` valida cada PR (`lint`, `test`, `build`); `deploy.yml` publica al hacer merge a `main`. |

---

## 6. Estructura del Proyecto, Matriz de Roles y Flujo (Criterio 8)

```text
becatrack/
├─ .github/
│  ├─ workflows/ci.yml              # lint, pruebas y build en cada PR
│  ├─ workflows/deploy.yml          # despliegue a AWS al hacer merge a main
│  ├─ pull_request_template.md
│  └─ CODEOWNERS
├─ prisma/
│  ├─ schema.prisma                 # modelo de datos (8 tablas)
│  ├─ migrations/                   # generadas por Prisma, se suben al repo
│  └─ seed.ts                       # usuarios de prueba por rol
├─ public/                          # estáticos: logos, imágenes, favicon
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # componente raíz (html, body, fuente Red Hat Display CUC)
│  │  ├─ globals.css                # Tailwind y paleta institucional CUC (#A3161A)
│  │  ├─ page.tsx                   # landing page pública
│  │  ├─ login/page.tsx             # formulario de acceso
│  │  ├─ api/auth/[...nextauth]/route.ts
│  │  └─ (dashboard)/
│  │     ├─ layout.tsx              # Sidebar + verificación de sesión
│  │     └─ dashboard/
│  │        ├─ page.tsx             # inicio según el rol
│  │        ├─ crm/                 # directorio CRM + ficha [id]/page.tsx
│  │        ├─ horario/             # placeholder (módulo existente)
│  │        ├─ asistencia/          # placeholder (módulo existente)
│  │        ├─ conteo-horas/
│  │        ├─ registro-horas/
│  │        ├─ dependencias/
│  │        ├─ staff/
│  │        └─ tareas/
│  ├─ components/
│  │  ├─ ui/                        # BarraProgreso.tsx y CucLogo.tsx
│  │  └─ layout/Sidebar.tsx         # menú filtrado por rol
│  ├─ modules/                      # lógica de negocio y Server Actions por módulo
│  │  ├─ crm/actions.ts
│  │  ├─ horas/actions.ts + queries.ts
│  │  ├─ dependencias/actions.ts
│  │  ├─ staff/actions.ts
│  │  └─ tareas/actions.ts + semaforo.ts
│  ├─ lib/
│  │  ├─ db.ts                      # cliente Prisma único
│  │  ├─ permissions.ts             # matriz rol -> módulos
│  │  └─ guards.ts                  # requireModule() para páginas y acciones
│  ├─ auth.config.ts                # configuración Auth.js compatible con Edge
│  ├─ auth.ts                       # configuración Auth.js con Prisma y bcrypt
│  └─ middleware.ts                 # bloquea rutas sin sesión o sin permiso
├─ tests/                           # pruebas unitarias Vitest
├─ Dockerfile
├─ docker-compose.yml               # producción: app + Caddy
├─ .env.example                     # plantilla de variables (URL de Neon)
├─ Caddyfile                        # dominio y HTTPS
├─ next.config.ts
└─ README.md
```

### Matriz de Roles (`src/lib/permissions.ts`)

| Módulo | Admin | Becario | Dependencia | En este proyecto |
| :--- | :---: | :---: | :---: | :--- |
| **CRM de becarios** | Sí | No | No | Construido |
| **Horario y Disponibilidad** | Sí | No | No | Placeholder protegido |
| **Asistencia y QR** | Sí | Sí | No | Placeholder protegido |
| **Conteo de horas sociales** | Sí | Sí (solo las suyas) | No | Construido |
| **Registro de horas sociales** | Sí | No | Sí | Construido |
| **Dependencias activas** | Sí | No | No | Construido |
| **Asignación a Staff y eventos** | Sí | Sí (ve sus asignaciones) | No | Construido |
| **Tareas pendientes (semáforo)** | Sí | No | No | Construido |

---

## 7. Flujo de Contribución (Gitflow y Conventional Commits)

* **Ramas:** `main` (producción), `develop` (integración), `feature/<modulo>-<descripcion>`, `fix/<descripcion>`, `release/v1.0.0`, `hotfix/<descripcion>`.
* **Conventional Commits:** `feat(crm): listar becarios con buscador`, `feat(tareas): calcular color del semaforo por fecha limite`, `test(permisos): cubrir accesos del rol dependencia`.
* **Pull Requests:** Plantilla obligatoria en `.github/pull_request_template.md`, validación de `lint`, `test` y `build` en GitHub Actions y aprobación por otro integrante del equipo.

---

## 8. Equipo

* **Líder e Infraestructura:** [@SearchGabx](https://github.com/SearchGabx)
* **Autenticación y Base:** [@integrante-1](https://github.com/integrante-1)
* **CRM y Dependencias:** [@integrante-2](https://github.com/integrante-2)
* **Horas, Staff y Tareas:** [@integrante-3](https://github.com/integrante-3)

---

## 9. Recursos

* [Next.js 15 Documentation](https://nextjs.org/docs)
* [Prisma ORM Documentation](https://www.prisma.io/docs)
* [Auth.js v5 Documentation](https://authjs.dev/)
* [Tailwind CSS Documentation](https://tailwindcss.com/docs)
* [Docker & Caddy Documentation](https://caddyserver.com/docs/)
* [Manual de Identidad Visual — Universidad de la Costa (CUC)](https://www.cuc.edu.co/)
