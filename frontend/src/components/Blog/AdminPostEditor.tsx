"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "@/lib/toast"
import { validatePost } from "@/utils/validation"
import type { Post } from "@personal-website/shared/types/post.types"
import { NEWSLETTER_TAGS } from "@personal-website/shared/schemas/newsletter.schema"
import {
  createPostAction,
  updatePostAction,
  generatePostAiSuggestionsAction,
} from "@/app/actions/posts"

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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: ["web3"] as string[],
    published: false,
    featuredImage: "",
  })
  const [notifySubscribers, setNotifySubscribers] = useState<boolean>(!post)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
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
      setNotifySubscribers(false)
    } else {
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        tags: ["web3"],
        published: false,
        featuredImage: "",
      })
      setNotifySubscribers(true)
    }
    setErrors({})
  }, [post])

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | string[],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const handleToggleSegmentTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleGenerateAiMetadata = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      toast.error("Escribe al menos el título o parte del contenido primero")
      return
    }
    setAiLoading(true)
    try {
      const res = await generatePostAiSuggestionsAction({
        title: formData.title,
        content: formData.content,
      })
      if (!res.success || !res.suggestion) {
        toast.error(res.error || "No se pudo conectar con Azure OpenAI")
        return
      }
      setFormData(prev => ({
        ...prev,
        excerpt: res.suggestion?.excerpt || prev.excerpt,
        tags: Array.from(
          new Set([...prev.tags, ...(res.suggestion?.suggestedTags ?? [])]),
        ),
      }))
      toast.success("Resumen y segmentos generados con Azure OpenAI")
    } catch {
      toast.error("Error al consultar Azure OpenAI")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (publish = false) => {
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

    const fd = new FormData()
    fd.set("title", formData.title)
    fd.set("content", formData.content)
    fd.set("excerpt", formData.excerpt)
    fd.set("tags", formData.tags.join(","))
    fd.set("published", String(publish))
    fd.set("featured", "false")
    fd.set("featuredImage", formData.featuredImage)
    fd.set("notifySubscribers", String(publish && notifySubscribers))

    startTransition(async () => {
      try {
        const result =
          post && post.id
            ? await updatePostAction(post.id, fd)
            : await createPostAction(fd)

        if (result.success) {
          const broadcastMsg =
            result.broadcast && result.broadcast.sentCount > 0
              ? ` • Enviado a ${result.broadcast.sentCount} suscriptores`
              : ""
          toast.success(
            (post ? "Post actualizado correctamente" : "Post publicado correctamente") +
              broadcastMsg,
          )
          if (onSaveAction) {
            await onSaveAction(formData as Partial<Post>)
          } else {
            router.push("/blog/admin")
            router.refresh()
          }
        } else {
          toast.error(result.error || "Error al guardar el post")
        }
      } catch (error) {
        toast.error("Error al guardar el post")
        console.error(error)
      } finally {
        setSaving(false)
      }
    })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancelAction ?? (() => router.push("/blog/admin"))}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-300 border border-slate-700 bg-slate-900 hover:border-slate-500 transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-mono)" }}
            disabled={saving || isPending}
          >
            ← Cancelar
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-purple-300 border border-purple-500/35 bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-mono)" }}
            disabled={saving || isPending}
          >
            {showPreview ? "Modo Editor" : "Vista Previa"}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving || isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {saving ? <LoadingSpinner size="sm" /> : "Guardar Borrador"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving || isPending}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--gradient-plasma)",
              boxShadow: "0 0 24px rgba(124, 58, 237, 0.35)",
            }}
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : notifySubscribers ? (
              "Publicar + Enviar Newsletter"
            ) : (
              "Publicar Ahora"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Column */}
        <div className="lg:col-span-8">
          <div
            className="rounded-2xl p-6 space-y-6 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Title */}
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-slate-400 mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Título del Artículo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange("title", e.target.value)}
                className={`block w-full px-4 py-3 border rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
                  errors.title ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="Ej. Arquitecturas Agénticas On-Chain sobre CELO..."
                disabled={saving || isPending}
              />
              {errors.title && (
                <p className="text-xs text-red-400 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-slate-400 mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Contenido (Markdown) *
              </label>
              {showPreview ? (
                <div className="border border-slate-700 rounded-xl p-5 min-h-96 bg-slate-950/80">
                  <div
                    className="prose prose-invert max-w-none"
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
                  onChange={e => handleInputChange("content", e.target.value)}
                  rows={20}
                  className={`block w-full px-4 py-3 border rounded-xl bg-slate-900/90 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/60 font-mono text-sm ${
                    errors.content ? "border-red-500" : "border-slate-700"
                  }`}
                  placeholder="Escribe el artículo en Markdown..."
                  disabled={saving || isPending}
                />
              )}
              {errors.content && (
                <p className="text-xs text-red-400 mt-1">{errors.content}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Copilot, Newsletter Broadcast, Segments & Excerpt */}
        <div className="lg:col-span-4 space-y-6">
          {/* Execution Layer Newsletter Dispatch Toggle */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: notifySubscribers
                ? "rgba(16, 185, 129, 0.45)"
                : "var(--color-border)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  [EXECUTION LAYER BROADCAST]
                </span>
                <label
                  htmlFor="notify-subscribers"
                  className="text-sm font-bold text-white cursor-pointer"
                >
                  Enviar a suscriptores del segmento
                </label>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Al publicar, dispara automáticamente el envío por lotes (Resend + React Email) a los usuarios activos de los tags seleccionados.
                </p>
              </div>
              <input
                id="notify-subscribers"
                type="checkbox"
                checked={notifySubscribers}
                onChange={e => setNotifySubscribers(e.target.checked)}
                disabled={saving || isPending}
                className="mt-1 h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Azure OpenAI Editorial Assistant */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "rgba(124, 58, 237, 0.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest text-purple-400"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                [AZURE OPENAI COPILOT]
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Genera automáticamente el resumen ejecutivo (`excerpt`) y sugiere los segmentos de lectura a partir de tu borrador.
            </p>
            <button
              type="button"
              onClick={handleGenerateAiMetadata}
              disabled={aiLoading || saving || isPending}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-purple-200 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 transition-colors disabled:opacity-50 cursor-pointer"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {aiLoading ? "Sintetizando con IA…" : "✦ Auto-Generar Excerpt & Tags"}
            </button>
          </div>

          {/* Excerpt */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <label
              className="block text-xs uppercase tracking-widest text-slate-400 mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Excerpt (Resumen)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={e => handleInputChange("excerpt", e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-slate-700 rounded-xl bg-slate-900/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              placeholder="Resumen corto del post (aparece en la tarjeta y en el email)..."
              disabled={saving || isPending}
            />
            {errors.excerpt && (
              <p className="text-xs text-red-400 mt-1">{errors.excerpt}</p>
            )}
          </div>

          {/* Reading Segments & Custom Tags */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <label
              className="block text-xs uppercase tracking-widest text-slate-400 mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Segmentos de Lectura (Newsletter)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {NEWSLETTER_TAGS.map(seg => {
                const active = formData.tags.includes(seg)
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => handleToggleSegmentTag(seg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                      active
                        ? "bg-purple-500/25 text-purple-200 border-purple-400/50"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    #{seg}
                  </button>
                )
              })}
            </div>

            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-3 py-2 border border-slate-700 rounded-xl bg-slate-900/90 text-white text-sm focus:outline-none"
                placeholder="Otro tag personalizado..."
                disabled={saving || isPending}
              />
              <button
                onClick={handleAddTag}
                type="button"
                className="px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-500 transition-colors cursor-pointer"
                disabled={saving || !tagInput.trim()}
              >
                +
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-teal-400 hover:text-white cursor-pointer"
                    disabled={saving || isPending}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {errors.tags && (
              <p className="text-xs text-red-400 mt-1">{errors.tags}</p>
            )}
          </div>

          {/* Featured Image */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <label
              className="block text-xs uppercase tracking-widest text-slate-400 mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Imagen Destacada (URL opcional)
            </label>
            <input
              type="url"
              value={formData.featuredImage}
              onChange={e => handleInputChange("featuredImage", e.target.value)}
              className="block w-full px-3 py-2 border border-slate-700 rounded-xl bg-slate-900/90 text-white text-sm focus:outline-none"
              placeholder="https://..."
              disabled={saving || isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
