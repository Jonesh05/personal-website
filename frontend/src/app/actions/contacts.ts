'use server'

import { ContactFormSchema } from "@personal-website/shared/schemas/contact.schema"
import * as contactsDb from '@/lib/firestore/contacts'

export async function submitContactAction(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    message: formData.get('message') as string,
  }

  const parsed = ContactFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    await contactsDb.createContact(parsed.data)
    return { success: true }
  } catch (error) {
    console.error('Failed to submit contact:', error)
    return { error: 'Failed to submit message. Please try again later.' }
  }
}
