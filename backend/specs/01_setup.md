# Jhonny Pimiento - Professional Website

Portafolio web actualizado con proyectos destacados, una parte de blog, entradas y no hay mucho mas.

## Stacks

### Frontend
- React + TypeScript
- Tailwindcss
- Next

### Backend
- Node.js
- Express
- Firebase

### Entidades
- Usuario
- Publicación

##Contratos

usuario/admin(solo admin)
json
{
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2021-01-01",
    "updated_at": "2021-01-01",
    "deleted_at": "2021-01-01"
}

/posts 

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
### Endpoints

GET /posts/:id listar publicacion
GET /posts/:id/:slug listar publicacion
POST /posts crear publicacion
PUT /posts/:id actualizar publicacion
DELETE /posts/:id eliminar publicacion
## Arquitectura

Frontend (TypeScript)     
│                  │
└─────────┬────────┘
          │
     Backend (Node.js)
          │
    Database (Firebase)

    
El enfoque es mantener la simplicidad y funcionalidad core sin features adicionales complejas.