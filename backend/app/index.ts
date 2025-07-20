import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Datos de ejemplo en memoria
const posts = [
  {
    id: '1',
    title: 'Mi primer post',
    slug: 'mi-primer-post',
    content: 'Este es el contenido de mi primer post...',
    excerpt: 'Un resumen del primer post',
    published: true,
    tags: ['desarrollo', 'web'],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  },
  {
    id: '2',
    title: 'Segundo post',
    slug: 'segundo-post',
    content: 'Contenido del segundo post...',
    excerpt: 'Resumen del segundo post',
    published: true,
    tags: ['react', 'typescript'],
    createdAt: '2024-01-20T14:30:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z'
  }
];

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// GET /posts - Listar posts
app.get('/posts', (req, res) => {
  res.json({ posts });
});

// GET /posts/:id - Obtener post por ID
app.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }
  
  res.json({ post });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Endpoints disponibles:`);
  console.log(`   GET  /test - Prueba del servidor`);
  console.log(`   GET  /posts - Listar posts`);
  console.log(`   GET  /posts/:id - Obtener post`);
});

export default app; 