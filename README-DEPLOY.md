# LinguaFlux — Guía de despliegue a producción

Esto conecta la app a **Supabase real** (auth + base de datos), **Stripe real**
(pagos) y mueve la llamada a **Groq** a una función serverless para que la
API key nunca esté expuesta en el navegador.

## 1. Supabase

1. Ve a https://supabase.com → crea un proyecto (o usa el que ya tienes).
2. Entra a **SQL Editor** → pega todo el contenido de `supabase/schema.sql` → **Run**.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → lo pondrás en `SUPABASE_URL`
   - `anon public key` → lo pondrás en `SUPABASE_ANON_KEY`
   - `service_role key` → **NUNCA la pongas en el frontend**, solo en Netlify (paso 4)

## 2. Stripe

1. Ve a https://dashboard.stripe.com → crea un **Producto** con un **Precio recurrente** (ej. $9.99/mes).
2. Copia el `Price ID` (empieza con `price_...`) → será `STRIPE_PRICE_ID`.
3. Ve a **Developers → API keys** → copia la `Secret key` → será `STRIPE_SECRET_KEY`.
4. Ve a **Developers → Webhooks → Add endpoint**:
   - URL: `https://TU-SITIO.netlify.app/.netlify/functions/stripe-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copia el `Signing secret` → será `STRIPE_WEBHOOK_SECRET`

## 3. Rellenar el frontend

Abre `index.html` y reemplaza:
```js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY-PUBLICA";
```
con tus valores reales del paso 1. Estos dos SÍ son seguros de exponer en el
navegador (están protegidos por las políticas RLS del esquema SQL).

## 4. Desplegar en Netlify

1. Sube esta carpeta a un repo de GitHub (o arrástrala directo en Netlify si prefieres deploy manual).
2. En Netlify → **Add new site → Import from Git** (o *Deploy manually*).
3. En **Site settings → Environment variables**, agrega:

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | tu key de Groq (opcional, si no la pones la app funciona en modo demo) |
| `STRIPE_SECRET_KEY` | del paso 2 |
| `STRIPE_PRICE_ID` | del paso 2 |
| `STRIPE_WEBHOOK_SECRET` | del paso 2 |
| `SUPABASE_URL` | del paso 1 |
| `SUPABASE_ANON_KEY` | del paso 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | del paso 1 (¡nunca la pongas en el HTML!) |

4. Deploy. Netlify detecta `netlify.toml` y publica las funciones automáticamente.

## 5. Crear tu cuenta admin

1. Entra a tu sitio ya desplegado y **regístrate normal** con tu email.
2. En Supabase → SQL Editor, ejecuta:
```sql
update public.profiles set is_admin = true where email = 'tu@email.com';
```
3. Vuelve a entrar a la app (cierra sesión y entra de nuevo) → verás el botón **Admin**.

## 6. Probar el flujo de pago

Usa la tarjeta de prueba de Stripe `4242 4242 4242 4242`, cualquier fecha
futura y cualquier CVC, mientras estés en modo **test** de Stripe. Cuando
confirmes que el webhook activa la suscripción correctamente en la tabla
`subscriptions`, cambia tus keys de Stripe a modo **live** para producción real.

## Qué se arregló respecto a la versión anterior

- ❌ Contraseña de admin hardcodeada en el HTML → ✅ ahora es un flag `is_admin`
  en la base de datos, protegido por Supabase Auth.
- ❌ Groq API key expuesta en el navegador → ✅ vive solo en el servidor
  (`netlify/functions/groq-chat.js`).
- ❌ "Supabase" solo guardado en `localStorage`, sin uso real → ✅ auth y
  progreso reales en Supabase, con RLS por usuario.
- ❌ Sin pago real, cualquiera usaba la app gratis → ✅ Stripe Checkout +
  webhook que activa/desactiva el acceso según el estado real de la suscripción.
