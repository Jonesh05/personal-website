//"use cache"

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPopularTags, getFeaturedPosts } from '@/lib/firestore/posts'

interface BlogPostSidebarProps {
    postId: string
    tags: string[]
}

// Table of Contents Component
const TableOfContents: React.FC<{ content: string }> = ({ content }) => {

    // Extract headings from content (simplified)
    const headings = content.match(/#{1,6} .+/g) || []

    if (headings.length === 0) return null

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tabla de Contenidos
            </h3>
            <nav className="space-y-2">
                {headings.map((heading, index) => {
                    const level = heading.match(/^#+/)?.[0].length || 1
                    const text = heading.replace(/^#+\s/, '')
                    const id = text.toLowerCase().replace(/[^\w]+/g, '-')

                    return (
                        <a
                            key={index}
                            href={`#${id}`}
                            className={`block text-sm hover:text-blue-600 dark:hover:text-blue-400 
                                transition-colors ${level > 2 ? 'pl-4' : ''}`}
                            style={{ paddingLeft: `${(level - 1) * 12}px` }}
                        >
                            {text}
                        </a>
                    )
                })}
            </nav>
        </div>
    )
}

// Reading Progress Component
const ReadingProgress: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progreso de Lectura
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Completado</span>
                    <span id="reading-percentage">0%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        id="reading-progress-bar"
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '0%' }}
                    ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tiempo estimado: <span id="estimated-time">5 min</span>
                </p>
            </div>
        </div>
    )
}

export const BlogPostSidebar: React.FC<BlogPostSidebarProps> = ({ postId, tags }) => {
    return (
        <div className="space-y-6">
            {/* Reading Progress */}
            <ReadingProgress />

            {/* Related Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tags Relacionados
                </h3>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Link
                            key={tag}
                            href={`/blog?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 
                dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            #{tag}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Acciones Rápidas
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 
                        dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 
                        bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir Artículo
                    </button>

                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: document.title,
                                    url: window.location.href
                                })
                            }
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 
                        dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 
                        bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Compartir
                    </button>
                </div>
            </div>
        </div>
    )
}

// Componente PopularTags
async function PopularTags() {
    const tags = await getPopularTags()

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tags Populares
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                        bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 
                        dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                        #{tag}
                    </Link>
                ))}
            </div>
        </div>
    )
}

// Componente FeaturedPosts
async function FeaturedPosts() {
    const featuredPosts = await getFeaturedPosts()

    if (featuredPosts.length === 0) {
        return null
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Posts Destacados
            </h3>
            <div className="space-y-4">
                {featuredPosts.slice(0, 3).map((post) => (
                    <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="flex space-x-3 group"
                    >
                        {post.featuredImage && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={post.featuredImage}
                                    alt={post.title}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white 
                                group-hover:text-blue-600 dark:group-hover:text-blue-400 
                                transition-colors line-clamp-2">
                                {post.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(post.createdAt).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

// Componente Newsletter
const Newsletter: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 
            dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Stay Updated
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Recibe las últimas actualizaciones sobre Web3, blockchain y desarrollo.
                </p>
                <div className="space-y-3">
                    <input
                        type="email"
                        placeholder="tu@email.com"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                            rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                            placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
                            focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="button"
                        className="w-full flex justify-center py-2 px-4 border border-transparent 
                            rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                            focus:ring-blue-500 transition-colors"
                    >
                        Suscribirse
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Sin spam. Solo contenido de calidad.
                </p>
            </div>
        </div>
    )
}

// Componente AboutAuthor
const AboutAuthor: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sobre el Autor
            </h3>
            <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 
                    rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">JP</span>
                </div>
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        Jhonny Pimiento
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Desarrollador Full Stack especializado en Web3, Blockchain y
                        Arquitectura en la Nube. Apasionado por las tecnologías emergentes
                        y la construcción de soluciones escalables.
                    </p>
                    <div className="flex space-x-2 mt-3">
                        <a
                            href="https://github.com/jonesh05"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                        <a
                            href="https://linkedin.com/in/jhonny-pimiento"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Exportar componentes como propiedades del objeto BlogSidebar
const BlogSidebar = {
    PopularTags,
    FeaturedPosts,
    Newsletter,
    AboutAuthor,
}

// Exportar por defecto el objeto
export default BlogSidebar

// También exportar componentes individuales
export { PopularTags, FeaturedPosts, Newsletter, AboutAuthor }