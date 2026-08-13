# Shanti

Seguimiento de ánimo, medicación y notas diarias para psicólogos y psiquiatras. Shanti significa paz.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind 4
- **Hosting:** Netlify (SPA + Functions)
- **Auth:** Firebase Authentication (email + Google)
- **DB:** Cloud Firestore (solo server-side vía Admin SDK)

## Requisitos

- Node.js 20+
- Cuenta [Netlify](https://netlify.com)
- Proyecto [Firebase](https://console.firebase.google.com) en plan Spark

## Configuración local

1. Cloná el repo e instalá dependencias:

```bash
npm install
```

2. Copiá `.env.example` a `.env` y completá las variables Firebase.

3. En Firebase Console:
   - Habilitá Authentication: Email/Password y Google
   - Creá Firestore en modo producción
   - Desplegá reglas: `firebase deploy --only firestore:rules,firestore:indexes`
   - Authorized domains: `localhost` + tu dominio Netlify

4. Generá una service account (Project Settings → Service accounts) y pegá el JSON en `FIREBASE_SERVICE_ACCOUNT` (solo en Netlify, no en el cliente).

5. Desarrollo frontend:

```bash
npm run dev
```

6. Desarrollo con Functions (requiere Netlify CLI):

```bash
npx netlify dev
```

## Deploy en Netlify

1. Conectá el repo a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables de entorno:
   - `VITE_FIREBASE_*` (todas las del cliente)
   - `FIREBASE_SERVICE_ACCOUNT` (JSON completo)
   - `ADMIN_EMAIL=daniel.quagliano@gmail.com`

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/i/:token` | Invitación paciente/staff |
| `/paciente/hoy` | Carga diaria del paciente |
| `/pro/pacientes` | Dashboard profesional |
| `/admin` | Panel admin global |

## UI Kit (solo dev)

`/dev/ui` — componentes de diseño para validar tokens visuales.
