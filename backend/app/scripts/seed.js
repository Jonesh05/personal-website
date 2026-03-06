// backend/app/scripts/seed.js
// Seeds LOCAL Firebase emulator — zero production writes
// Run: node backend/app/scripts/seed.js
//
// Prerequisites:
//   1. firebase emulators:start --project portfolio-website-668ce
//   2. Create admin user at http://localhost:4000/auth
//      Email: newrevolutiion@gmail.com → copy the generated UID
//   3. Set ADMIN_UID below, then run this script

'use strict'

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081'

const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'portfolio-website-668ce' })

const db = admin.firestore()

// ── REPLACE THIS ──────────────────────────────────────────────
const ADMIN_UID   = 'UHzuFfHIX6HfNqleID71NmMdkamC'
const ADMIN_EMAIL = 'newrevolutiion@gmail.com'
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// POSTS  (published: boolean — matches frontend Post type)
// ──────────────────────────────────────────────────────────────
const POSTS = [
  {
    id: 'post-server-actions',
    title:         'How Server Actions Replaced Our Entire API Layer',
    slug:          'server-actions-replaced-api-layer',
    excerpt:       'We deleted 14 API route files and replaced them with 6 Server Actions. Here is why and how.',
    content: [
      '# How Server Actions Replaced Our Entire API Layer',
      '',
      '## Server Actions in Next.js 16',
      '',
      'A Server Action is just an async function marked `\'use server\'`.',
      'It runs on the server, has access to cookies, and gets called from the client as a regular function:',
      '',
      '```typescript',
      "// No fetch, no token, no CORS",
      'const result = await createPostAction(formData)',
      '```',
      '',
      '## Security model',
      '',
      'Each action calls `getSessionUser()` first — verifying the httpOnly session cookie',
      'cryptographically before touching Firestore. No token ever reaches the client bundle.',
    ].join('\n'),
    tags:          ['next.js', 'server-actions', 'typescript', 'architecture'],
    published:     true,
    featured:      false,
    featuredImage: '',
    authorId:      ADMIN_UID,
    authorName:    'JP Admin',
    likes:         8,
    views:         215,
    createdAt:     new Date('2026-01-20T09:00:00Z'),
    updatedAt:     new Date('2026-01-21T11:00:00Z'),
  },
  {
    id: 'post-firestore-rules',
    title:         'Firestore Security Rules: From Expired to Production-Ready',
    slug:          'firestore-rules-production-ready',
    excerpt:       'The codebase had rules expiring 2025-08-20. Here is the production-grade replacement.',
    content: [
      '## The expired rule',
      '',
      '```javascript',
      'allow read, write: if request.time < timestamp.date(2025, 8, 20);',
      '```',
      '',
      '## Production approach',
      '',
      'Since all writes go through the Admin SDK (which bypasses rules entirely),',
      'client-side write rules can be `false`:',
      '',
      '```javascript',
      'match /posts/{postId} {',
      '  allow read: if resource.data.published == true;',
      '  allow write: if false;',
      '}',
      '```',
      '',
      'Zero client writes = zero attack surface on the data layer.',
    ].join('\n'),
    tags:          ['firebase', 'security', 'firestore'],
    published:     true,
    featured:      true,
    featuredImage: '',
    authorId:      ADMIN_UID,
    authorName:    'JP Admin',
    likes:         12,
    views:         340,
    createdAt:     new Date('2026-02-05T14:00:00Z'),
    updatedAt:     new Date('2026-02-06T09:30:00Z'),
  },
  {
    id: 'post-draft-example',
    title:         'Tailwind CSS 4 Migration Notes (Draft)',
    slug:          'tailwind-css-4-migration-notes',
    excerpt:       'Internal notes on migrating from Tailwind 3 to 4 — utility renaming, new @theme directive.',
    content: [
      '## Migration checklist',
      '',
      '- Replace `@apply` usage in globals.css with `@theme` tokens where possible.',
      '- `bg-opacity-*` → `bg-{color}/{opacity}` shorthand.',
      '- The new CSS-first config (`@theme {}`) replaces `tailwind.config.js`.',
      '',
      '> This post is a draft and only visible in the admin dashboard.',
    ].join('\n'),
    tags:          ['tailwind', 'css', 'migration'],
    published:     false,   // DRAFT — visible only in admin dashboard
    featured:      false,
    featuredImage: '',
    authorId:      ADMIN_UID,
    authorName:    'JP Admin',
    likes:         0,
    views:         0,
    createdAt:     new Date(),
    updatedAt:     new Date(),
  },
]

// ──────────────────────────────────────────────────────────────
// PROJECTS  (kept from original seed — same schema, real image paths)
// ──────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title:       'Utilscore E-commerce',
    description: 'Full e-commerce platform built with Vite + React + TypeScript. Cart, checkout, product management and admin panel.',
    image:       '/images/projects/utilscore.webp',
    technologies:['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand'],
    category:    'web',
    status:      'completed',
    links:       { live: 'https://ecommerce-demo.com', github: 'https://github.com/usuario/ecommerce' },
    featured:    true,
    year:        2024,
    order:       1,
  },
  {
    title:       'NFT ReFi Platform',
    description: 'Regenerative finance platform using NFTs for environmental projects. Smart contracts, minting and integrated marketplace.',
    image:       '/images/NFT-card.webp',
    technologies:['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
    category:    'blockchain',
    status:      'completed',
    links:       { demo: 'https://nft-refi-demo.com', github: 'https://github.com/usuario/nft-refi' },
    featured:    true,
    year:        2024,
    order:       2,
  },
  {
    title:       'Quantum Computing Research',
    description: 'R&D with Qiskit for quantum algorithms applied to portfolio optimization and machine learning.',
    image:       '/images/projects/quantum.webp',
    technologies:['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
    category:    'ai',
    status:      'in-progress',
    links:       { github: 'https://github.com/usuario/quantum-research' },
    featured:    false,
    year:        2024,
    order:       3,
  },
  {
    title:       'Hackathon Clerk',
    description: 'Hackathon-winning blockchain solution for supply chain traceability using smart contracts and oracles.',
    image:       '/images/projects/hackathon.webp',
    technologies:['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
    category:    'blockchain',
    status:      'completed',
    links:       { demo: 'https://supply-chain-demo.com' },
    featured:    true,
    year:        2023,
    order:       4,
  },
  {
    title:       'Design System & UI Kit',
    description: 'Complete design system with reusable components, design tokens and interactive documentation.',
    image:       '/images/projects/design-system.webp',
    technologies:['React', 'Storybook', 'Figma', 'Styled Components'],
    category:    'web',
    status:      'completed',
    links:       { live: 'https://design-system-demo.com' },
    featured:    false,
    year:        2023,
    order:       5,
  },
  {
    title:       'AI Trading Bot',
    description: 'Automated trading bot using machine learning for technical analysis and strategy execution on crypto markets.',
    image:       '/images/projects/trading-bot.webp',
    technologies:['Python', 'TensorFlow', 'Pandas', 'Binance API'],
    category:    'ai',
    status:      'in-progress',
    links:       { github: 'https://github.com/usuario/ai-trading-bot' },
    featured:    false,
    year:        2024,
    order:       6,
  },
]

// ──────────────────────────────────────────────────────────────
// CONTACTS  (matches FirestoreContact schema from SKILL.md)
// ──────────────────────────────────────────────────────────────
/* const CONTACTS = [
  {
    name:      'Alice Johnson',
    email:     'alice@example.com',
    message:   'Love your portfolio! Would you be interested in a freelance React project for our startup?',
    read:      false,
    createdAt: new Date('2026-02-20T10:30:00Z'),
  },
  {
    name:      'Carlos Rivera',
    email:     'carlos.r@example.com',
    message:   'Great blog post on Firestore rules. Could you write a follow-up about Firestore indexes and composite queries?',
    read:      true,
    createdAt: new Date('2026-02-25T16:15:00Z'),
  },
  {
    name:      'Maria Chen',
    email:     'maria.chen@example.com',
    message:   'Hi JP, I saw your NFT ReFi project and I am working on something similar. Would love to connect and discuss potential collaboration.',
    read:      false,
    createdAt: new Date('2026-03-01T08:45:00Z'),
  },
]
 */
// ──────────────────────────────────────────────────────────────
// RUNNER
// ──────────────────────────────────────────────────────────────
async function seedCollection(collectionName, items, getId) {
  console.log(`\n📦 Seeding ${collectionName}...`)
  for (const item of items) {
    const id = getId ? getId(item) : null
    const ref = id
      ? db.collection(collectionName).doc(id)
      : db.collection(collectionName).doc()

    const { id: _drop, ...data } = item
    await ref.set({ ...data, createdAt: data.createdAt || new Date(), updatedAt: data.updatedAt || new Date() })
    console.log(`  ✅ ${collectionName}/${ref.id} — "${item.title || item.name}"`)
  }
}

async function main() {
  if (ADMIN_UID === 'REPLACE_WITH_AUTH_EMULATOR_UID') {
    console.error('\n❌ ERROR: Set ADMIN_UID before running this script.')
    console.error('   1. Open http://localhost:4000/auth')
    console.error('   2. Add user: newrevolutiion@gmail.com')
    console.error('   3. Copy the generated UID into this file\n')
    process.exit(1)
  }

  console.log('🔥 Seeding Firestore emulator (localhost:8081)...')
  console.log(`   Admin UID: ${ADMIN_UID}\n`)

  await seedCollection('posts',    POSTS,    item => item.id)
  await seedCollection('projects', PROJECTS, null)
  //await seedCollection('contacts', CONTACTS, null)

  console.log('\n✓ All collections seeded.')
  console.log('  → Inspect at http://localhost:4000/firestore\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
