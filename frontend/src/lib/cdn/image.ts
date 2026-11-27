/**
 * CDN-agnostic image resolver for project and blog assets.
 *
 * Usage:
 *   // In data layer — describe the image, not the URL:
 *   image: { provider: 'cloudinary', publicId: 'projects/nft-platform' }
 *   image: { provider: 'cloudflare', imageId: 'abc123' }
 *   image: { provider: 'local', path: '/images/NFT-card.webp' }
 *   image: { provider: 'og' }   // auto-generated from project metadata
 *
 *   // At render time — resolve to URL:
 *   const src = resolveProjectImage(project.image, project)
 *
 * Environment variables consumed (all NEXT_PUBLIC_* for client-side access):
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME         e.g. "my-cloud"
 *   NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH e.g. "abcdef123456"
 */

export type CloudinaryTransform = {
  width?:   number
  height?:  number
  crop?:    'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad'
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  quality?: number | 'auto'
  format?:  'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

/** Discriminated union — add new providers here, never use bare strings in data. */
export type ProjectImage =
  | {
      provider:   'cloudinary'
      publicId:   string
      transform?: CloudinaryTransform
    }
  | {
      provider:  'cloudflare'
      imageId:   string
      /** Cloudflare Images variant name (default: "public") */
      variant?:  string
    }
  | {
      provider: 'local'
      /** Absolute path from /public, e.g. "/images/NFT-card.webp" */
      path:     string
    }
  | {
      /**
       * Auto-generated Edge OG image via /api/og/project.
       * No asset needed — title/category/accentColor come from the project.
       */
      provider: 'og'
    }
  | {
      /** Escape hatch for raw external URLs (use sparingly). */
      provider: 'url'
      href:     string
    }

export interface OGContext {
  title:      string
  category:   string
  accentColor: 'purple' | 'green'
  technologies?: string[]
}

/** Default CDN transform for project card thumbnails (400×250). */
const CARD_DEFAULTS: Required<CloudinaryTransform> = {
  width:   400,
  height:  250,
  crop:    'fill',
  gravity: 'auto',
  quality: 'auto',
  format:  'auto',
}

function buildCloudinaryUrl(
  publicId:  string,
  transform: CloudinaryTransform = {},
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
  if (!cloud) {
    console.warn('[cdn/image] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set')
  }
  const t = { ...CARD_DEFAULTS, ...transform }
  const ops = [
    `w_${t.width}`,
    `h_${t.height}`,
    `c_${t.crop}`,
    `g_${t.gravity}`,
    `q_${t.quality}`,
    `f_${t.format}`,
  ].join(',')

  return `https://res.cloudinary.com/${cloud}/image/upload/${ops}/${publicId}`
}

function buildCloudflareUrl(imageId: string, variant = 'public'): string {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH ?? ''
  if (!accountHash) {
    console.warn('[cdn/image] NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH is not set')
  }
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`
}

function buildOgUrl(ctx: OGContext): string {
  const params = new URLSearchParams({
    title:    ctx.title,
    category: ctx.category,
    accent:   ctx.accentColor,
  })
  if (ctx.technologies?.length) {
    params.set('tech', ctx.technologies.slice(0, 4).join(','))
  }
  return `/api/og/project?${params.toString()}`
}

/**
 * Resolves a ProjectImage descriptor to a concrete URL.
 *
 * @param image    - The typed image descriptor from the data layer.
 * @param context  - Project metadata needed for OG fallback.
 */
export function resolveProjectImage(
  image:   ProjectImage,
  context: OGContext,
): string {
  switch (image.provider) {
    case 'cloudinary':
      return buildCloudinaryUrl(image.publicId, image.transform)

    case 'cloudflare':
      return buildCloudflareUrl(image.imageId, image.variant)

    case 'local':
      return image.path

    case 'og':
      return buildOgUrl(context)

    case 'url':
      return image.href
  }
}
