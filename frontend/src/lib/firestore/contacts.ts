import { adminDb } from '@/lib/firebase/admin'
import type { ContactFormInput } from '@personal-website/shared/schemas/contact.schema'

const COLLECTION = 'contacts'

export interface Contact {
  id:        string
  name:      string
  email:     string
  message:   string
  read:      boolean
  createdAt: string
}

export async function createContact(data: ContactFormInput) {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    read:      false,
    createdAt: new Date(),
  })
  return ref.id
}

export async function getContacts(): Promise<Contact[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs.map(doc => {
    const d = doc.data()
    return {
      id:        doc.id,
      name:      (d.name    as string) ?? '',
      email:     (d.email   as string) ?? '',
      message:   (d.message as string) ?? '',
      read:      (d.read    as boolean) ?? false,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? String(d.createdAt ?? ''),
    }
  })
}