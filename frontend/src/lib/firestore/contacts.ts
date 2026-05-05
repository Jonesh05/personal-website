import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { ContactFormInput } from '@personal-website/shared/schemas/contact.schema'
import type { ContactStatus } from '@personal-website/shared/types/newsletter.types'

const COLLECTION = 'contacts'

export interface Contact {
  id:        string
  name:      string
  email:     string
  message:   string
  status:    ContactStatus
  source:    string
  read:      boolean
  createdAt: string
  updatedAt: string
}

export async function createContact(
  data: ContactFormInput,
): Promise<{ id: string }> {
  const now = FieldValue.serverTimestamp()
  const ref = await adminDb.collection(COLLECTION).add({
    name:      data.name,
    email:     data.email,
    message:   data.message,
    source:    data.source ?? 'contact-page',
    status:    'received' satisfies ContactStatus,
    read:      false,
    createdAt: now,
    updatedAt: now,
  })
  return { id: ref.id }
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
}

export async function getContacts(): Promise<Contact[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs.map(doc => {
    const d = doc.data()
    const createdAt = d.createdAt?.toDate?.()?.toISOString() ?? String(d.createdAt ?? '')
    const updatedAt = d.updatedAt?.toDate?.()?.toISOString() ?? createdAt
    return {
      id:        doc.id,
      name:      (d.name    as string) ?? '',
      email:     (d.email   as string) ?? '',
      message:   (d.message as string) ?? '',
      status:    ((d.status as ContactStatus) ?? 'received'),
      source:    (d.source  as string) ?? 'contact-page',
      read:      (d.read    as boolean) ?? false,
      createdAt,
      updatedAt,
    }
  })
}
