import { onRequest } from 'firebase-functions/v2/https'
import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireAdmin } from './middlewares/auth'
import { postsService } from './services/posts.service'
import { Post } from 'shared/types/post.types'

// Interface for authenticated user
interface AuthenticatedUser {
  uid: string;
  email: string;
  role: string;
  displayName?: string;
}


// Cargar variables de entorno
dotenv.config();

const app: Express = express();
//const PORT = process.env.PORT || 8000;

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

// Configuración de Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

//// Configuración de CORS
/*const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://tudominio.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.includes(origin)) { 
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); 
*///

// Configuración de CORS
const allowedOrigins = process.env.FRONTEND_URLS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://portfolio-website-668ce.firebaseapp.com',
  'https://portfolio-website-668ce.web.app'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Datos de ejemplo
/*interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const posts: Post[] = [
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
]; */

// ===== RUTAS =====

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/*Change
// Posts endpoints
app.get('/posts', (req: Request, res: Response) => {
  try {
    const { published, tag } = req.query;
    let filteredPosts = [...posts];

    if (published !== undefined) {
      filteredPosts = filteredPosts.filter(p => p.published === (published === 'true'));
    }

    if (tag) {
      filteredPosts = filteredPosts.filter(p => p.tags.includes(tag as string));
    }

    res.json({ 
      posts: filteredPosts,
      total: filteredPosts.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/posts/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({ error: 'ID de post requerido' });
    }

    const post = posts.find(p => p.id === id);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post no encontrado',
        id: id 
      });
    }
    
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo post
app.post('/posts', (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Título y contenido son requeridos' 
      });
    }

    const newPost: Post = {
      id: String(posts.length + 1),
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      published: false,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.push(newPost);
    res.status(201).json({ post: newPost });
  } catch (error) {
    res.status(500).json({ error: 'Error creando el post' });
  }
});

// ===== ERROR HANDLERS =====

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /test', 
      'GET /posts',
      'GET /posts/:id',
      'POST /posts'
    ]
  });
});  */

// Obtener posts públicos (solo publicados)
app.get('/posts', async (req: Request, res: Response) => {
  try {
    const { tag, limit = '10', offset = '0' } = req.query;

    const filters = {
      published: true, // Solo posts publicados para el público
      tag: tag as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await postsService.getPosts(filters);

    res.json({
      posts: result.posts,
      total: result.total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasNext: result.posts.length === filters.limit
      }
    });
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener post público por slug
app.get('/posts/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const post = await postsService.getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Solo mostrar si está publicado (para rutas públicas)
    if (!post.published) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Error obteniendo post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS PROTEGIDAS (ADMIN) =====

// Middleware de autenticación para todas las rutas admin
app.use('/admin/*', authenticateToken);

// Obtener todos los posts (incluyendo borradores) - ADMIN
app.get('/admin/posts', async (req: Request, res: Response) => {
  try {
    const { published, tag, limit = '10', offset = '0' } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (published !== undefined) {
      filters.published = published === 'true';
    }
    if (tag) {
      filters.tag = tag as string;
    }

    const result = await postsService.getPosts(filters);

    res.json({
      posts: result.posts,
      total: result.total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
      }
    });
  } catch (error) {
    console.error('Error obteniendo posts admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener post por ID - ADMIN
app.get('/admin/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await postsService.getPostById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Error obteniendo post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo post - ADMIN
app.post('/admin/posts', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags = [], published = false, featuredImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Título y contenido son requeridos'
      });
    }

    // Generar slug automáticamente
    const slug = postsService.generateSlug(title);

    const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      published,
      tags: Array.isArray(tags) ? tags : [],
      authorId: req.user!.uid,
      featuredImage: featuredImage || '',
      authorName: (req.user as AuthenticatedUser)?.displayName || '',
      likes: 0,
      views: 0,
    };

    const newPost = await postsService.createPost(postData);

    res.status(201).json({ post: newPost });
  } catch (error) {
    console.error('Error creando post:', error);
    if (error instanceof Error && error.message.includes('slug')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error creando el post' });
  }
});

// Actualizar post - ADMIN
app.put('/admin/posts/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si se actualiza el título, regenerar slug
    if (updateData.title && !updateData.slug) {
      updateData.slug = postsService.generateSlug(updateData.title);
    }

    const updatedPost = await postsService.updatePost(id, updateData);

    res.json({ post: updatedPost });
  } catch (error) {
    console.error('Error actualizando post:', error);
    if (error instanceof Error && error.message.includes('encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('slug')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error actualizando el post' });
  }
});

// Eliminar post - ADMIN
app.delete('/admin/posts/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await postsService.deletePost(id);

    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando post:', error);
    if (error instanceof Error && error.message.includes('encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error eliminando el post' });
  }
});

// Verificar autenticación admin
app.get('/admin/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// ===== ERROR HANDLERS =====

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /posts',
      'GET /posts/slug/:slug',
      'GET /admin/posts (requiere auth)',
      'POST /admin/posts (requiere auth)',
      'PUT /admin/posts/:id (requiere auth)',
      'DELETE /admin/posts/:id (requiere auth)',
    ]
  });
});


// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  
  if (err.message === 'Bloqueado por CORS') {
    return res.status(403).json({ error: 'CORS: Origin no permitido' });
  }

  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

export const api = onRequest(app); 

// Iniciar servidor
/*const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Endpoints disponibles:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /test - Prueba del servidor`);
  console.log(`   GET  /posts - Listar posts`);
  console.log(`   GET  /posts/:id - Obtener post`);
  console.log(`   POST /posts - Crear post`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});
*/

export default app;