# Olist Commercial Dashboard

Dashboard comercial para monitoreo de ventas construido sobre el dataset público **Brazilian E-Commerce Public Dataset by Olist** (~100k órdenes reales).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + TanStack Query |
| Backend | Node.js + Express + TypeScript — arquitectura hexagonal |
| ORM | Prisma 5 con `multiSchema` |
| Base de datos | PostgreSQL 16 — schemas `raw`, `clean`, `dwh` |
| Infra | Docker Compose (3 servicios: `db`, `backend`, `frontend`) |

---

## Requisitos previos

- Docker Desktop (o Docker Engine + Compose plugin)
- Git

No se necesita Node.js ni PostgreSQL instalados localmente — todo corre dentro de Docker.

---

## Instalación y arranque

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd olist-dashboard
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El `.env.example` incluye valores por defecto funcionales para desarrollo local. Los únicos campos que podés querer cambiar son las credenciales de la base de datos.

```env
# Base de datos
POSTGRES_USER=olist
POSTGRES_PASSWORD=olist_password
POSTGRES_DB=olist_db
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=3001
NODE_ENV=development
JWT_SECRET=dev_secret_change_in_production

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Levantar los servicios

```bash
docker compose up --build
```

Docker ejecuta automáticamente los scripts de inicialización en `database/init/` en orden numérico:

| Script | Qué hace |
|--------|----------|
| `01_schemas.sql` | Crea los schemas `raw`, `clean`, `dwh` |
| `02_raw_tables.sql` | Crea las tablas `raw.*` (reflejo directo de los CSV) |
| `03_clean_tables.sql` | Crea las tablas `clean.*` con constraints y tipos correctos |
| `04_dwh_tables.sql` | Crea el esquema estrella en `dwh.*` |
| `05_load_csvs.sh` | Carga los 8 CSV del dataset Olist en `raw.*` |
| `06_etl.sql` | Ejecuta el pipeline ETL completo: raw → clean → dwh |

> El healthcheck del servicio `db` garantiza que el backend solo arranca una vez que PostgreSQL está listo y los datos están cargados.

### 4. Los datos se cargan automáticamente

Al levantar por primera vez, Docker ejecuta `05_load_csvs.sh` que:
1. Carga los 8 CSV del dataset Olist en `raw.*`
2. Ejecuta el ETL completo `raw → clean → dwh`

Para que funcione, los CSV deben estar en `database/csvs/` antes de correr `docker compose up`.

Descargalos desde: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
```

### 5. URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/health |

---

## Endpoints de la API

Todos los endpoints requieren los parámetros `from` y `to` en formato `YYYY-MM-DD`.

```
GET /health
GET /api/kpis?from=2017-01-01&to=2017-12-31
GET /api/trend/revenue?from=2017-01-01&to=2017-12-31&grain=day|week
GET /api/rankings/products?from=2017-01-01&to=2017-12-31&metric=gmv|revenue&limit=10
```

**Filtros opcionales disponibles en todos los endpoints:**

| Parámetro | Ejemplo | Descripción |
|-----------|---------|-------------|
| `orderStatus` | `delivered` | Estado de la orden en `dim_order` |
| `productCategory` | `electronics` | Categoría en inglés de `dim_product` |
| `customerState` | `SP` | Estado del cliente (código de 2 letras) en `dim_customer` |

**Reglas de validación:**
- `from` y `to` son obligatorios
- `from` debe ser anterior a `to`
- El rango máximo es 730 días (2 años)
- `limit` máximo: 100

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  page.tsx → TanStack Query hooks → services/api.ts → HTTP       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / REST
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Express — Hexagonal)                  │
│                                                                   │
│  adapters/http                                                    │
│  ├── routes/index.ts          ← registra rutas                   │
│  ├── controllers/*.ts         ← parsea HTTP, llama use case      │
│  └── validation/schemas.ts    ← Zod, valida query params         │
│                                                                   │
│  application/usecases                                             │
│  ├── GetKpis.ts               ← valida fechas, llama port        │
│  ├── GetRevenueTrend.ts       ← valida grain, llama port         │
│  └── GetTopProducts.ts        ← valida limit, llama port         │
│                                                                   │
│  domain                                                           │
│  ├── ports/SalesRepository.ts ← interfaz (contrato)              │
│  ├── entities/KpiResult.ts    ← tipos de retorno                 │
│  └── filters/SalesFilters.ts  ← tipos de entrada                 │
│                                                                   │
│  infrastructure                                                   │
│  └── repositories/PrismaSalesRepository.ts  ← implementa port   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma $queryRaw → SQL
┌────────────────────────────▼────────────────────────────────────┐
│                    POSTGRESQL — 3 schemas                         │
│  raw.*    ← CSV cargados tal cual (tipos TEXT, sin constraints)  │
│  clean.*  ← tipos correctos, nulls manejados, deduplicado       │
│  dwh.*    ← esquema estrella (fact_sales + 5 dimensiones)        │
└─────────────────────────────────────────────────────────────────┘
```

**Regla crítica:** el backend **nunca** consulta `raw` ni `clean`. Todas las queries del API usan `dwh.fact_sales` como driving table, con JOINs a las dimensiones cuando se necesitan atributos.

---

## Modelo de datos — Esquema estrella

### Fact table

**`dwh.fact_sales`** — grano: 1 fila por ítem de orden (`order_id + order_item_id`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `order_id` | TEXT (PK) | FK → `dim_order` |
| `order_item_id` | INT (PK) | Número de ítem dentro de la orden |
| `date_id` | DATE | FK → `dim_date` |
| `customer_id` | TEXT | FK → `dim_customer` |
| `product_id` | TEXT | FK → `dim_product` |
| `seller_id` | TEXT | FK → `dim_seller` |
| `item_price` | DECIMAL | Precio del ítem (base para GMV) |
| `freight_value` | DECIMAL | Costo de envío del ítem |
| `payment_value_allocated` | DECIMAL | Pago prorrateado al ítem (ver nota) |
| `is_delivered` | BOOLEAN | `order_status = 'delivered'` |
| `is_canceled` | BOOLEAN | `order_status IN ('canceled', 'unavailable')` |
| `is_on_time` | BOOLEAN? | `delivered_date <= estimated_date` (NULL si no entregado) |
| `order_item_count` | INT | Total de ítems en esa orden |
| `payment_type` | TEXT? | Método de pago dominante de la orden |
| `payment_installments` | INT? | Cuotas del pago dominante |

### Dimensiones

| Tabla | Clave | Atributos principales |
|-------|-------|-----------------------|
| `dwh.dim_date` | `date_id` (DATE) | year, quarter, month, week, day_of_week, is_weekend |
| `dwh.dim_customer` | `customer_id` | customer_unique_id, city, state, zip_code_prefix |
| `dwh.dim_product` | `product_id` | category_name, category_name_english, weight_g, volume_cm3 |
| `dwh.dim_order` | `order_id` | status, timestamps, delivery_days, delivery_delay_days, review_score |
| `dwh.dim_seller` | `seller_id` | city, state, zip_code_prefix |

### Nota: asignación de `payment_value` a nivel ítem

En Olist, los pagos están registrados a nivel de orden (una orden puede tener múltiples pagos). Para mantener el grano item-level en `fact_sales` se utilizó **prorrateo proporcional al precio**:

```sql
payment_value_allocated =
  ROUND(total_payment_of_order * (item_price / sum_of_all_item_prices_in_order), 2)
```

Si `sum_of_all_item_prices = 0`, se asigna `0` (caso defensivo, no ocurre en el dataset limpio).

---

## Definición de KPIs

Todos los KPIs se calculan en el backend a partir de `dwh.fact_sales`. El frontend solo presenta los valores recibidos — no realiza ningún cálculo.

### 1. GMV (Gross Merchandise Value)
```
GMV = SUM(item_price)
```
Suma de los precios de todos los ítems en el rango. No incluye flete.

### 2. Revenue (Paid)
```
Revenue = SUM(payment_value_allocated)
```
Suma de pagos prorrateados. Si una orden tiene múltiples pagos, se suman antes del prorrateo. Puede diferir del GMV por descuentos, vouchers o diferencias de redondeo.

### 3. Orders
```
Orders = COUNT(DISTINCT order_id)
```
Cantidad de órdenes únicas en el rango (independientemente de cuántos ítems tengan).

### 4. AOV (Average Order Value)
```
AOV = Revenue / Orders   (0 si Orders = 0)
```

### 5. Items per Order (IPO)
```
IPO = COUNT(order_item_id) / Orders   (0 si Orders = 0)
```
Promedio de ítems por orden.

### 6. Cancellation Rate
```
Cancel Rate = COUNT(DISTINCT order_id WHERE is_canceled) / COUNT(DISTINCT order_id)
```
`is_canceled = true` cuando `order_status IN ('canceled', 'unavailable')`. Se incluye `'unavailable'` porque representa órdenes que no pudieron concretarse — económicamente equivalentes a cancelaciones desde la perspectiva del vendedor.

### 7. On-Time Delivery Rate
```
On-Time Rate = COUNT(DISTINCT order_id WHERE is_on_time) / COUNT(DISTINCT order_id WHERE is_delivered)
```
Solo se computan órdenes efectivamente entregadas (`is_delivered = true`). `is_on_time = NULL` para órdenes no entregadas (no se cuentan ni en numerador ni en denominador).

### 8. Top Products
Ranking de productos por GMV (`SUM(item_price)`) o por Revenue (`SUM(payment_value_allocated)`), agrupado por `product_id`, con `LIMIT N`.

### 9. Revenue Trend
Serie temporal de Revenue y Orders agrupada por:
- `day`: `date_id::TEXT` → formato `YYYY-MM-DD`
- `week`: `TO_CHAR(DATE_TRUNC('week', date_id), 'IYYY-"W"IW')` → formato `2017-W03`

---

## Capas de datos (ETL)

### raw.*
Tablas que reflejan los CSV tal cual. Todos los campos son `TEXT` para absorber cualquier valor sin errores de parsing. Sin constraints de integridad referencial.

Tablas cargadas:
- `raw.customers`
- `raw.orders`
- `raw.order_items`
- `raw.order_payments`
- `raw.order_reviews`
- `raw.products`
- `raw.sellers`
- `raw.product_category_translation`

### clean.*
Reglas de limpieza aplicadas:

- **Tipos:** `NULLIF(col, '')::TIPO` — convierte strings vacíos a NULL antes de castear, evitando errores en campos numéricos y de timestamp
- **Deduplicación:** `DISTINCT ON (pk)` en todos los INSERT — elimina filas duplicadas por clave primaria
- **Normalización de texto:** `LOWER(TRIM(city))`, `UPPER(TRIM(state))` — consistencia en campos geográficos
- **Conflictos:** `ON CONFLICT DO NOTHING` — idempotencia (el ETL se puede re-ejecutar sin duplicar datos)
- **Integridad básica:** se descartan filas con PK NULL o vacía

### dwh.*
Esquema estrella poblado desde `clean.*`. Ver sección anterior para detalle del modelo.

---

## Tests

### Correr los tests (fuera de Docker)

```bash
cd backend
npm install
npm run test:unit    # 3 tests unitarios de use cases
npm run test:int     # 1 test de integración del endpoint /api/kpis
npm run test         # todos
npm run test:coverage
```

### Estructura

```
src/__tests__/
├── unit/
│   ├── GetKpis.test.ts          # valida lógica de fechas y propagación de errores
│   ├── GetRevenueTrend.test.ts  # valida grain válido/inválido y llamada al repositorio
│   └── GetTopProducts.test.ts  # valida limit > 0 y métricas gmv/revenue
└── integration/
    └── kpis.endpoint.test.ts   # valida HTTP 200/400 sin DB (mock del repositorio)
```

Los tests unitarios mockean `SalesRepository` (la interfaz del dominio) — no tocan Prisma ni la DB.
El test de integración mockea `PrismaSalesRepository` — prueba el stack HTTP completo (rutas, controllers, validación Zod, use cases) sin necesidad de una DB real.

---

## Comandos útiles

```bash
# Levantar todo
docker compose up --build

# Ver logs de un servicio específico
docker compose logs -f backend

# Conectarse a la DB
docker compose exec db psql -U olist -d olist_db

# Ver datos del DWH
docker compose exec db psql -U olist -d olist_db -c "SELECT COUNT(*) FROM dwh.fact_sales"

# Reiniciar solo el backend (después de cambios en código)
docker compose restart backend

# Apagar y eliminar volúmenes (reset completo)
docker compose down -v
```

---

## Decisiones técnicas y tradeoffs

**Arquitectura hexagonal en el backend**
El dominio (`domain/`) no importa nada de Express, Prisma ni PostgreSQL. Esto permite testear los use cases con mocks simples de la interfaz `SalesRepository`, sin levantar la DB. Tradeoff: más archivos y más indirección que un controller-directo-a-DB. La ganancia es testabilidad y que cambiar el ORM no toca el dominio ni los tests.

**Prisma `$queryRaw` en lugar de queries generadas**
Los KPIs requieren agregaciones complejas (`COUNT DISTINCT`, `CASE WHEN`, prorrateo) que los métodos generados de Prisma no pueden expresar eficientemente. `$queryRaw` con `Prisma.sql` mantiene los beneficios de parametrización automática (previene SQL injection) con el control total del SQL. Tradeoff: se pierde type-safety automática en el retorno — se resuelve con tipos locales (`KpiRow`, `TrendRow`, etc.) y casteo explícito.

**Grano item-level en `fact_sales`**
El grain 1-fila-por-ítem (en lugar de 1-fila-por-orden) habilita KPIs de producto y categoría sin sub-queries. El costo es que `payment_value` necesita prorrateo. La alternativa (grain por orden) simplifica pagos pero impide rankings de producto sin joins adicionales.

**`is_canceled` incluye `'unavailable'`**
Las órdenes con status `'unavailable'` representan casos donde el producto no pudo ser despachado. Desde la perspectiva del negocio (GMV perdido, experiencia del cliente), son equivalentes a cancelaciones. Está documentado en el comentario del SQL y en este README.

**TanStack Query en el frontend**
Maneja caché, loading/error states, y refetch automático. Alternativa sería `useEffect + fetch` manual, pero TanStack Query evita race conditions y duplicación de lógica de estado en cada componente.

**Docker healthchecks con `depends_on: condition: service_healthy`**
El backend espera que la DB esté lista antes de arrancar. Sin esto, Prisma falla al intentar conectarse durante el boot si PostgreSQL todavía está inicializando. El healthcheck de la DB usa `pg_isready` que verifica que el servidor acepta conexiones reales.

---

## Estructura del repositorio

```
olist-dashboard/
├── docker-compose.yml
├── .env.example
├── database/
│   ├── csvs/                    ← CSVs del dataset Olist
│   └── init/                    ← Scripts SQL ejecutados por Docker al iniciar
│       ├── 01_schemas.sql
│       ├── 02_raw_tables.sql
│       ├── 03_clean_tables.sql
│       ├── 04_dwh_tables.sql
│       └── 05_etl.sql
├── backend/
│   ├── src/
│   │   ├── app.ts               ← Express app (sin listen)
│   │   ├── server.ts            ← Entry point (solo listen)
│   │   ├── adapters/http/       ← Controllers, routes, validation
│   │   ├── application/         ← Use cases
│   │   ├── domain/              ← Entities, ports, filters
│   │   ├── infrastructure/      ← Prisma client y repositorios
│   │   └── __tests__/           ← Unit e integration tests
│   ├── prisma/schema.prisma
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── app/                 ← Pages (Next.js App Router)
    │   ├── components/          ← UI components
    │   ├── hooks/               ← TanStack Query hooks
    │   ├── services/api.ts      ← HTTP client
    │   └── types/               ← TypeScript types
    └── Dockerfile
```