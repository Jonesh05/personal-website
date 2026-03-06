export const validatePost = (data: {
    title: string
    content: string
    excerpt?: string
    tags: string[]
}) => {
    const errors: Record<string, string> = {}

    if (!data.title.trim()) {
        errors.title = 'El título es requerido'
    } else if (data.title.length < 3) {
        errors.title = 'El título debe tener al menos 3 caracteres'
    } else if (data.title.length > 200) {
        errors.title = 'El título no puede exceder 200 caracteres'
    }

    if (!data.content.trim()) {
        errors.content = 'El contenido es requerido'
    } else if (data.content.length < 50) {
        errors.content = 'El contenido debe tener al menos 50 caracteres'
    }

    if (data.excerpt && data.excerpt.length > 300) {
        errors.excerpt = 'El excerpt no puede exceder 300 caracteres'
    }

    if (data.tags.length > 10) {
        errors.tags = 'No se pueden agregar más de 10 tags'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

export const sanitizeSlug = (text: string) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Spaces to hyphens
        .replace(/-+/g, '-') // Multiple hyphens to single
        .trim()
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}