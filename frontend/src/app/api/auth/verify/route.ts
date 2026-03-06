import { NextResponse }    from 'next/server'
import { getSessionUser }  from '@/lib/auth/session'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }
    return NextResponse.json({
      isAdmin:     user.isAdmin,
      displayName: user.name,
      email:       user.email,
    })
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}
