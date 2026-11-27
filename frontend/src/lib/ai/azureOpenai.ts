// frontend/src/lib/ai/azureOpenai.ts
// Server-only Azure OpenAI Editorial Copilot service.
//
// Environment variables (server-only, never exposed to client):
//   AZURE_OPENAI_ENDPOINT       e.g. "https://your-resource.openai.azure.com"
//   AZURE_OPENAI_API_KEY        Azure OpenAI API key
//   AZURE_OPENAI_DEPLOYMENT     Deployment name (e.g. "gpt-4o" or "gpt-4o-mini")
//   AZURE_OPENAI_API_VERSION    Defaults to "2024-08-01-preview"

import 'server-only'

export interface AzureOpenAIConfigStatus {
  configured: boolean
  deployment: string | null
  endpointHost: string | null
}

export interface EditorialSuggestion {
  excerpt: string
  suggestedTags: string[]
  outlineMarkdown?: string
}

export function getAzureOpenAIStatus(): AzureOpenAIConfigStatus {
  const endpoint   = (process.env.AZURE_OPENAI_ENDPOINT ?? '').trim()
  const apiKey     = (process.env.AZURE_OPENAI_API_KEY ?? '').trim()
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT ?? '').trim()

  if (!endpoint || !apiKey || !deployment) {
    return {
      configured:   false,
      deployment:   deployment || null,
      endpointHost: null,
    }
  }

  let endpointHost: string | null = null
  try {
    endpointHost = new URL(endpoint).host
  } catch {
    endpointHost = null
  }

  return {
    configured: Boolean(endpointHost),
    deployment,
    endpointHost,
  }
}

export async function generateEditorialMetadata(params: {
  title: string
  content: string
}): Promise<EditorialSuggestion> {
  const endpoint   = (process.env.AZURE_OPENAI_ENDPOINT ?? '').trim().replace(/\/$/, '')
  const apiKey     = (process.env.AZURE_OPENAI_API_KEY ?? '').trim()
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT ?? '').trim()
  const apiVersion = (process.env.AZURE_OPENAI_API_VERSION ?? '2024-08-01-preview').trim()

  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      'Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT.',
    )
  }

  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content:
            'You are a Principal Engineering Editorial Assistant for Jhonny Pimiento (Web3, AI Agents, Cybersecurity, Cloud). Return strict JSON with keys: "excerpt" (max 240 chars) and "suggestedTags" (array of 2-4 lowercase tags from: web3, ai, cybersecurity, cloud, refi, engineering).',
        },
        {
          role: 'user',
          content: `Title: ${params.title}\n\nContent:\n${params.content.slice(0, 4000)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Azure OpenAI responded ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const rawJson = data.choices?.[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(rawJson) as Partial<EditorialSuggestion>

  return {
    excerpt:       typeof parsed.excerpt === 'string' ? parsed.excerpt : '',
    suggestedTags: Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.map(t => String(t).toLowerCase())
      : ['web3'],
  }
}
