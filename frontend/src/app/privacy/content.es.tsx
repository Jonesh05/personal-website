export function PrivacyBodyES() {
  return (
    <>
      <p>
        Este sitio pertenece a Jhonny Pimiento — un único autor independiente.
        El objetivo de esta política es describir, en lenguaje claro, qué
        datos se recopilan, por qué y cómo se manejan.
      </p>

      <h2>Datos que compartes directamente</h2>
      <p>
        Cuando usas el formulario de contacto o envías un correo compartes tu
        nombre, dirección de email y el contenido de tu mensaje. Esa
        información se usa únicamente para responderte. No se vende, alquila
        ni comparte con terceros.
      </p>

      <h2>Datos recopilados automáticamente</h2>
      <ul>
        <li>
          <strong>Identificador de visitante.</strong> Se almacena un UUID
          aleatorio en una cookie llamada <code>visitor-id</code>. Se usa
          para deduplicar visitas a artículos y recordar qué publicaciones
          te han gustado o has guardado. No se vincula a información personal.
        </li>
        <li>
          <strong>Idioma.</strong> La cookie <code>site-locale</code> guarda
          tu idioma preferido para renderizar las páginas correctamente.
        </li>
        <li>
          <strong>Cookies de sesión (solo admin).</strong> Si te autenticas
          como administrador, se almacena una cookie de sesión de Firebase
          firmada. Es <code>httpOnly</code> y solo el servidor la usa.
        </li>
      </ul>

      <h2>Analítica</h2>
      <p>
        Las vistas de los artículos se almacenan en Firestore para mostrar
        señales de lectura públicamente. La analítica no te rastrea entre
        sitios ni usa fingerprinting.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes borrar todas las cookies en cualquier momento desde la
        configuración de tu navegador para reiniciar el identificador de
        visitante y las preferencias. Si quieres que los mensajes enviados a
        través del formulario se eliminen de mi bandeja de entrada,
        escríbeme y lo haré.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Si esta política cambia, se actualizará la fecha de &quot;última
        actualización&quot; arriba. Los cambios importantes se destacarán en
        la página de inicio.
      </p>

      <h2>Contacto</h2>
      <p>
        ¿Dudas sobre privacidad? Escríbeme a{' '}
        <a href="mailto:jopimiento@gmail.com">jopimiento@gmail.com</a>.
      </p>
    </>
  )
}
