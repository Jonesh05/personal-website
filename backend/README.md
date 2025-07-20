# Jhonny Pimiento - Professional Website

Portafolio web actualizado con proyectos destacados, una parte de blog, entradas y no hay mucho mas.

## Stacks

### Frontend
- React + TypeScript
- Tailwindcss
- Next

### Backend
- Node.js
- Firebase Client SDK

### Entidades
- Usuario
- Publicación

## Contratos

usuario/admin(solo admin)
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2021-01-01",
    "updated_at": "2021-01-01",
    "deleted_at": "2021-01-01"
}
```

/posts 

```json
{
  - "id": 1,
  - "title": string
  - "slug": string
  - "content": string
  - "excerpt": string
  - "published": boolean
  - "createdAt": timestamp
  - "updatedAt": timestamp
  - "tags": array
  - "featuredImage?": string
}
```

### Endpoints

- GET /posts/:id listar publicacion
- GET /posts/:id/:slug listar publicacion
- POST /posts crear publicacion
- PUT /posts/:id actualizar publicacion
- DELETE /posts/:id eliminar publicacion

---

## Seguridad y CORS

- **CORS solo se implementa en el backend**. El frontend (Next.js) no debe tener ninguna configuración de CORS.
- **Lista blanca de orígenes**: Solo se permiten los dominios configurados en la variable de entorno `FRONTEND_URLS`.
- **Métodos y headers permitidos**: Solo los necesarios para la API.
- **Manejo eficiente de preflight**: Las solicitudes OPTIONS responden con 204 y sin lógica adicional.
- **Nunca uses `*` en producción**.
- **No expongas credenciales a menos que sea necesario**.
- **Configura los orígenes desde variables de entorno** para flexibilidad entre entornos de desarrollo y producción.

### Variables de entorno relevantes

- `FRONTEND_URLS`: Lista separada por comas de los orígenes permitidos (ejemplo: `http://localhost:3000,https://portfolio-website-668ce.firebaseapp.com`).
- `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`: Ruta al archivo de credenciales de Firebase Admin SDK.
- `PORT`: Puerto en el que corre el backend (opcional, por defecto 8000).

---

## Flujo de Backend

1. **Helmet** para headers de seguridad.
2. **CORS** solo en el backend, con lista blanca y headers estrictos.
3. **Rate limiting** para evitar abuso.
4. **Validación y sanitización** de entradas.
5. **Autenticación y autorización** robusta (solo admin puede escribir).
6. **Manejo centralizado de errores**.
7. **Reglas Firestore** para reforzar la seguridad a nivel de base de datos.

---

## Despliegue

- Asegúrate de tener configuradas las variables de entorno correctamente en tu entorno de producción.
- Deploya las reglas de Firestore con `firebase deploy --only firestore:rules`.
- Inicia el backend con Node.js/TS.
- El frontend debe consumir la API desde los dominios permitidos en `FRONTEND_URLS`.

---

## Notas

- Si tienes errores de CORS, revisa la consola del navegador y asegúrate de que el backend responde con los encabezados correctos.
- No implementes CORS en el frontend. Solo el backend debe tener esta configuración.


