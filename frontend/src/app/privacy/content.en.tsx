export function PrivacyBodyEN() {
  return (
    <>
      <p>
        This site belongs to Jhonny Pimiento — a single independent author. The
        goal of this policy is to describe, in plain language, what data the
        site collects, why, and how it is handled.
      </p>

      <h2>Data you share directly</h2>
      <p>
        When you use the contact form or send an email, you share your name,
        email address, and the content of your message. That information is
        used solely to reply to you. It is not sold, rented, or shared with
        third parties.
      </p>

      <h2>Data collected automatically</h2>
      <ul>
        <li>
          <strong>Visitor identifier.</strong> A random UUID is stored in a
          cookie named <code>visitor-id</code>. It is used to deduplicate
          article views and to remember which posts you have liked or saved.
          It is not linked to any personal information.
        </li>
        <li>
          <strong>Locale.</strong> A <code>site-locale</code> cookie stores
          your preferred language so pages render correctly on the server.
        </li>
        <li>
          <strong>Session cookies (admin only).</strong> If you authenticate
          as an administrator, a signed Firebase session cookie is stored.
          It is <code>httpOnly</code> and only used by the server.
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        Article view counts are stored in Firestore to show reading signals
        publicly. Analytics do not track you across sites and do not use
        fingerprinting.
      </p>

      <h2>Your rights</h2>
      <p>
        You can clear all cookies at any time from your browser settings to
        reset the visitor identifier and preferences. If you want messages you
        sent via the contact form to be deleted from my inbox, email me and I
        will honour the request.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, the &quot;last updated&quot; date above will
        be refreshed. Material changes will be highlighted on the home page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Reach me at{' '}
        <a href="mailto:jopimiento@gmail.com">jopimiento@gmail.com</a>.
      </p>
    </>
  )
}
