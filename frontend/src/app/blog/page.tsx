import { Suspense } from 'react'
import { Metadata } from 'next'
import { InfinitePostList } from '@/components/Blog/InfinitePostList'
import  BlogSidebar  from '@/components/Blog/BlogSidebar'
import { BlogHeader } from '@/components/Blog/BlogHeader'
import BlogSectionSkeleton from '@/components/Blog/BlogSectionSkeleton'
import { getPosts, getPopularTags, getFeaturedPosts } from '@/lib/firestore/posts'

// Metadata para SEO
export const metadata: Metadata = {
    title: 'Blog | Jhonny Pimiento - Web3, Blockchain & Cloud Architecture',
    description: 'Insights técnicos sobre Web3, desarrollo blockchain, arquitectura en la nube y las últimas tendencias en tecnología.',
    keywords: ['Web3', 'Blockchain', 'Cloud Architecture', 'AWS', 'React', 'Next.js', 'TypeScript'],
    openGraph: {
        title: 'Blog - Jhonny Pimiento',
        description: 'Insights técnicos sobre Web3, desarrollo blockchain y arquitectura en la nube.',
        type: 'website',
        url: '/blog',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog - Jhonny Pimiento',
        description: 'Insights técnicos sobre Web3, desarrollo blockchain y arquitectura en la nube.',
    }
}

interface BlogPageProps {
    searchParams: {
        tag?: string
        search?: string
    }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const { tag: selectedTag, search: searchQuery } = await searchParams

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <BlogHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Breadcrumbs y filtros activos */}
                        {(selectedTag || searchQuery) && (
                            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span>Mostrando resultados para:</span>
                                        {selectedTag && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                        font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                #{selectedTag}
                                            </span>
                                        )}
                                        {searchQuery && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                        font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                "{searchQuery}"
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href="/blog"
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 
                                            dark:hover:text-blue-300 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Limpiar filtros
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Posts List con Infinite Scroll */}
                        <Suspense fallback={<BlogSectionSkeleton count={8} />}>
                            <InfinitePostList
                                initialTag={selectedTag}
                                initialSearch={searchQuery}
                            />
                        </Suspense>
                    </div>

                    {/* Sidebar */}
                    <div className="mt-12 lg:mt-0 lg:col-span-4">
                        <div className="sticky top-24 space-y-8">
                            {/* Search Widget */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Buscar Artículos
                                </h3>
                                <form action="/blog" method="get" className="space-y-3">
                                    <div>
                                        <label htmlFor="search" className="sr-only">Buscar</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                id="search"
                                                name="search"
                                                type="text"
                                                defaultValue={searchQuery}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                                                    rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                                                    placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
                                                    focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Buscar en el blog..."
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                                            shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Buscar
                                    </button>
                                </form>
                            </div>

                            {/* Popular Tags */}
                            <Suspense fallback={
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="space-y-2">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 inline-block mr-2"></div>
                                        ))}
                                    </div>
                                </div>
                            }>
                                <BlogSidebar.PopularTags />
                            </Suspense>

                            {/* Featured Posts */}
                            <Suspense fallback={
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex space-x-3">
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }>
                                <BlogSidebar.FeaturedPosts />                                
                            </Suspense>

                            {/* Newsletter Signup */}
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

                            {/* About Widget */}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}