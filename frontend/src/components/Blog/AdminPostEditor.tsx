
"use client"

import { useState, useEffect, useTransition } from "react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "@/lib/toast"
import { validatePost } from "@/utils/validation"
import type { Post } from "@personal-website/shared/types/post.types"
import { createPostAction, updatePostAction } from "@/app/actions/posts"

interface AdminPostEditorProps {
	post: Post | null
	onSaveAction?: (postData: Partial<Post>) => Promise<void>
	onCancelAction?: () => void
}

export const AdminPostEditor: React.FC<AdminPostEditorProps> = ({
	post,
	onSaveAction,
	onCancelAction,
}) => {
	const [isPending, startTransition] = useTransition()
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		excerpt: "",
		tags: [] as string[],
		published: false,
		featuredImage: "",
	})
	const [tagInput, setTagInput] = useState("")
	const [saving, setSaving] = useState(false)
	const [showPreview, setShowPreview] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})

	useEffect(() => {
		if (post) {
			setFormData({
				title: post.title,
				content: post.content,
				excerpt: post.excerpt || "",
				tags: post.tags || [],
				published: post.published,
				featuredImage: post.featuredImage || "",
			})
		} else {
			setFormData({
				title: "",
				content: "",
				excerpt: "",
				tags: [],
				published: false,
				featuredImage: "",
			})
		}
		setErrors({})
	}, [post])

		const handleInputChange = (field: string, value: any) => {
			setFormData((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}

	const handleAddTag = () => {
		const tag = tagInput.trim()
		if (tag && !formData.tags.includes(tag)) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, tag],
			}))
			setTagInput("")
		}
	}

	const handleRemoveTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}))
	}

	const handleSubmit = async (publish = false) => {
		// Validación frontend
		const { isValid, errors: validationErrors } = validatePost({
			...formData,
			published: publish,
		} as typeof formData & { published: boolean })
		if (!isValid) {
			setErrors(validationErrors)
			toast.error("Corrige los errores antes de continuar")
			return
		}

		setSaving(true)

		// Build FormData for Server Action
		const fd = new FormData()
		fd.set('title', formData.title)
		fd.set('content', formData.content)
		fd.set('excerpt', formData.excerpt)
		fd.set('tags', formData.tags.join(','))
		fd.set('published', String(publish))
		fd.set('featured', 'false')
		fd.set('featuredImage', formData.featuredImage)

		startTransition(async () => {
			try {
				let result
				if (post && post.id) {
					// Update existing post
					result = await updatePostAction(post.id, fd)
				} else {
					// Create new post
					result = await createPostAction(fd)
				}

				if (result.success) {
					toast.success(post ? 'Post actualizado correctamente' : 'Post creado correctamente')
					if (onSaveAction) await onSaveAction(formData as Partial<Post>)
				} else {
					toast.error(result.error || 'Error al guardar el post')
				}
			} catch (error) {
				toast.error("Error al guardar el post")
				console.error(error)
			} finally {
				setSaving(false)
			}
		})
	}

	// Accesibilidad: submit con Enter en input de tags
	const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault()
			handleAddTag()
		}
	}

		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<button
							onClick={onCancelAction}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
								text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 
								hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
							disabled={saving || isPending}
						>
							Cancelar
						</button>
						<button
							onClick={() => setShowPreview((v) => !v)}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
								text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 
								hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
							disabled={saving || isPending}
						>
							{showPreview ? "Editor" : "Preview"}
						</button>
					</div>
					<div className="flex items-center space-x-3">
						<button
							onClick={() => handleSubmit(false)}
							disabled={saving || isPending}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
								text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 
								hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
						>
							{saving ? <LoadingSpinner size="sm" /> : "Guardar Borrador"}
						</button>
						<button
							onClick={() => handleSubmit(true)}
							disabled={saving || isPending}
							className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium 
								hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
						>
							{saving ? <LoadingSpinner size="sm" /> : "Publicar"}
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Main Editor */}
					<div className="lg:col-span-8">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
							{/* Title */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Título *
								</label>
								<input
									type="text"
									value={formData.title}
									onChange={(e) => handleInputChange("title", e.target.value)}
									className={`block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
										errors.title
											? "border-red-500 dark:border-red-400"
											: "border-gray-300 dark:border-gray-600"
									}`}
									placeholder="Título del post..."
									disabled={saving || isPending}
								/>
								{errors.title && (
									<p className="text-xs text-red-500 mt-1">{errors.title}</p>
								)}
							</div>

							{/* Content */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Contenido *
								</label>
								{showPreview ? (
									<div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 min-h-96 bg-gray-50 dark:bg-gray-900">
										<div
											className="prose dark:prose-invert max-w-none"
											dangerouslySetInnerHTML={{
												__html: formData.content
													.replace(/\n/g, "<br>")
													.replace(/(#+)(.*)/g, "<strong>$2</strong>"),
											}}
										/>
									</div>
								) : (
									<textarea
										value={formData.content}
										onChange={(e) => handleInputChange("content", e.target.value)}
										rows={20}
										className={`block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
											errors.content
												? "border-red-500 dark:border-red-400"
												: "border-gray-300 dark:border-gray-600"
										}`}
										placeholder="Contenido del post en Markdown o HTML..."
										disabled={saving || isPending}
									/>
								)}
								{errors.content && (
									<p className="text-xs text-red-500 mt-1">{errors.content}</p>
								)}
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-4 space-y-6">
						{/* Excerpt */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Excerpt
							</label>
							<textarea
								value={formData.excerpt}
								onChange={(e) => handleInputChange("excerpt", e.target.value)}
								rows={3}
								className={`block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
									errors.excerpt
										? "border-red-500 dark:border-red-400"
										: "border-gray-300 dark:border-gray-600"
								}`}
								placeholder="Resumen corto del post..."
								disabled={saving || isPending}
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Se generará automáticamente si se deja vacío
							</p>
							{errors.excerpt && (
								<p className="text-xs text-red-500 mt-1">{errors.excerpt}</p>
							)}
						</div>

						{/* Featured Image */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Imagen Destacada
							</label>
							<input
								type="url"
								value={formData.featuredImage}
								onChange={(e) => handleInputChange("featuredImage", e.target.value)}
								className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
								placeholder="https://ejemplo.com/imagen.jpg"
								disabled={saving || isPending}
							/>
						</div>

						{/* Tags */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Tags
							</label>
							<div className="flex space-x-2 mb-3">
								<input
									type="text"
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={handleTagInputKeyDown}
									className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
									placeholder="Agregar tag..."
									disabled={saving || isPending}
								/>
								<button
									onClick={handleAddTag}
									type="button"
									className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
									disabled={saving || !tagInput.trim()}
								>
									+
								</button>
							</div>
							<div className="flex flex-wrap gap-2">
								{formData.tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
									>
										{tag}
										<button
											onClick={() => handleRemoveTag(tag)}
											className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
											disabled={saving || isPending}
										>
											×
										</button>
									</span>
								))}
							</div>
							{errors.tags && (
								<p className="text-xs text-red-500 mt-1">{errors.tags}</p>
							)}
						</div>

						{/* Status */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Estado
							</label>
							<div className="flex items-center">
								<input
									type="checkbox"
									id="published"
									checked={formData.published}
									onChange={(e) =>
										handleInputChange("published", e.target.checked)
									}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									disabled={saving || isPending}
								/>
								<label
									htmlFor="published"
									className="ml-2 text-sm text-gray-700 dark:text-gray-300"
								>
									Publicar inmediatamente
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
}
