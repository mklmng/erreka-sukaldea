# Erreka Sukaldea · sitio web de demostración

Sitio estático para **Erreka Sukaldea**, un restaurante **ficticio** de cocina
vasca contemporánea. Nombre, dirección, teléfono, horarios, equipo, platos y
precios son **datos provisionales inventados** y así se indica en cada página.

- HTML5 semántico, CSS moderno y JavaScript vanilla.
- Sin compilación, sin `npm`, sin dependencias: se publica tal cual en
  GitHub Pages.
- Inspiración editorial en la restauración vasca contemporánea (mucho aire,
  tipografía con serifa, paleta sobria). No reutiliza código, textos, imágenes
  ni diseño de ningún restaurante real.

## Estructura

```
erreka-sukaldea/
├── index.html              Portada
├── cocina.html             Carta de temporada y menú degustación
├── galeria.html            Galería + créditos de imágenes (#creditos)
├── sobre-nosotros.html     Historia, trayectoria y equipo
├── contacto.html           Datos, horario y formulario de solicitud (#reserva)
├── css/
│   ├── reset.css           Reset moderno + orden de capas (@layer)
│   └── styles.css          Tokens, base, layout, componentes BEM, utilidades
├── js/
│   ├── main.js             Menú móvil, año del pie, visor de galería
│   └── reservas.js         Validación del formulario (solo en contacto.html)
├── assets/images/          Ilustraciones SVG originales + CREDITOS.md
├── .nojekyll               Desactiva Jekyll en GitHub Pages
└── README.md
```

Todas las rutas son **relativas** (`css/styles.css`, `cocina.html`…), así que
el sitio funciona igual en `https://usuario.github.io/repositorio/` que en un
dominio propio o abriendo los archivos en local.

## Desarrollo local

Basta con abrir `index.html` en el navegador. Los scripts son clásicos con
`defer` (no módulos ES) precisamente para que también funcionen con `file://`.

Para probar en condiciones parecidas a las reales, usa un servidor local:

```bash
# Con Python 3
python3 -m http.server 8000
# Abre http://localhost:8000
```

Cualquier otro servidor estático sirve (extensión Live Server de VS Code,
`npx serve`, etc.).

## Decisiones técnicas

### CSS

- **Capas** (`@layer reset, tokens, base, layout, components, utilities`):
  el orden se declara al principio de `reset.css`, el primer CSS que se carga.
- **BEM**: `.bloque__elemento--modificador`. Cada elemento se escribe como
  selector completo: el **nesting nativo no concatena** `&__elemento` como
  hace Sass, así que solo se anida lo que es válido en CSS: `&:hover`,
  `&[aria-current="page"]`, `&::before`, `& img` y `@media` dentro de la regla.
- **Tokens** en custom properties: color, escala tipográfica fluida con
  `clamp()`, espaciado y anchos. La sección oscura (`.section--sea`) reasigna
  tokens para mantener el contraste sin duplicar componentes.
- **Grid y Flexbox**: `.grid-auto` (columnas automáticas con `minmax`),
  `.split` (dos columnas desde 52em), galería con 12 columnas en escritorio.
- **:has()** solo como mejora (sombra de cabecera con menú abierto, bloqueo de
  scroll con el visor abierto, realce de etiqueta enfocada). Va en reglas
  independientes; la información de error se marca también con la clase
  `.form__field--invalid`, que añade JavaScript.
- **::before / ::after**: raya del antetítulo, icono del menú, puntos guía
  entre plato y precio, numeración del menú degustación, comillas de la cita.
- **@supports**: alternativa de foco para navegadores sin `:focus-visible`.
- **Movimiento**: todas las animaciones y transiciones están dentro de
  `@media (prefers-reduced-motion: no-preference)`, incluida la transición
  entre páginas (`@view-transition`, donde el navegador la admite).

### Navegadores antiguos

`@layer` y el nesting nativo requieren navegadores recientes (aprox. Chrome
120+, Firefox 117+, Safari 17.2+ para nesting). Estrategia:

- Navegadores **sin `@layer`** ignoran los estilos en capas. El HTML es
  semántico y el orden del contenido es lógico, así que la página sigue siendo
  legible con los estilos por defecto; `reset.css` deja fuera de capa solo
  reglas inocuas (imágenes con `max-width: 100%`, ajuste de tamaño de texto).
- Navegadores **con `@layer` pero sin nesting** conservan los estilos
  principales y pierden los refinamientos anidados (estados hover, consultas
  de medios internas), porque las reglas anidadas van siempre al final de
  cada bloque. El foco visible no está anidado.

Si hay que dar soporte completo a navegadores antiguos, la alternativa es
procesar el CSS con una herramienta (por ejemplo Lightning CSS) que aplane
capas y nesting, lo que añade un paso de compilación que este proyecto evita
a propósito.

### JavaScript y mejora progresiva

- `main.js`: menú móvil siguiendo el patrón *disclosure* (`aria-expanded`,
  `aria-controls`, Escape cierra y devuelve el foco, se cierra al salir con el
  teclado o al pulsar fuera). Sin JS, la navegación se muestra completa.
- Visor de galería con `<dialog>` nativo: añade un botón «Ampliar» por imagen,
  gestiona el foco y se cierra con Escape. Sin `<dialog>` o sin JS, las imágenes
  y sus pies se ven igualmente.
- La clase `no-js` del `<html>` se cambia a `js` con un script en línea mínimo
  en el `<head>`, para que el menú no parpadee.

## Formulario de solicitud de reserva

Campos: nombre, correo, teléfono (opcional), fecha, hora, comensales y
observaciones, más una casilla de confirmación de que se trata de una
solicitud.

Validaciones en el navegador (`js/reservas.js`), con mensajes en español:

- Obligatorios vacíos, formato de correo y de teléfono (9–15 cifras).
- Fecha: no pasada, máximo 90 días vista, cerrado lunes y martes.
- Hora: cenas solo de jueves a sábado; si la fecha es hoy, hora no pasada.
- Comensales: entero entre 1 y 8. Observaciones: máximo 500 caracteres,
  con contador que solo se anuncia al lector de pantalla en umbrales.

Accesibilidad: cada campo tiene `<label>`, pistas y errores enlazados con
`aria-describedby`, `aria-invalid` en los campos con error, resumen de
errores que recibe el foco y enlaza a cada campo, y error indicado con texto,
símbolo y borde además del color.

**El formulario no envía datos.** Al ser válido muestra un resumen y avisa de
que no se ha enviado nada ni existe reserva. Sin JavaScript, los botones de
envío no se muestran y un `<noscript>` lo explica, para no simular un envío.

### Conectar el formulario (pendiente)

GitHub Pages solo sirve archivos estáticos: no puede recibir formularios. Para
recibir solicitudes reales hace falta un servicio externo, por ejemplo un
servicio de formularios para sitios estáticos, una función *serverless* o el
sistema de reservas del propio restaurante. Al conectarlo:

1. Añade `action` y `method="post"` al formulario (nunca `GET`, que pondría
   datos personales en la URL) o envía con `fetch` desde `reservas.js`.
2. Mantén el aviso de que la solicitud no es una reserva hasta que el
   restaurante la confirme.
3. Añade la información de protección de datos (responsable, finalidad,
   conservación, derechos) que exija la normativa aplicable.

## Imágenes y licencias

Todas las imágenes actuales son ilustraciones SVG **creadas para este
proyecto**; no se han usado fotografías de terceros ni se han inventado
créditos. El registro está en `assets/images/CREDITOS.md` y en
`galeria.html#creditos`. Ese archivo explica cómo añadir fotografías con
licencia y qué datos registrar (autor, fuente, URL, licencia, atribución).

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta a la raíz
   de la rama `main` (incluido el archivo oculto `.nojekyll`).
   ```bash
   git init
   git add .
   git commit -m "Sitio de demostración Erreka Sukaldea"
   git branch -M main
   git remote add origin https://github.com/USUARIO/REPOSITORIO.git
   git push -u origin main
   ```
2. En el repositorio: **Settings → Pages → Build and deployment**, origen
   **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. Tras unos minutos el sitio estará en
   `https://USUARIO.github.io/REPOSITORIO/`.

Las páginas llevan `<meta name="robots" content="noindex">` porque el
contenido es ficticio. Quítalo cuando el sitio tenga datos reales.

## Pruebas

### Qué se ha comprobado durante el desarrollo

Comprobaciones automatizadas ejecutadas en el entorno de desarrollo (no se
incluyen en el repositorio):

- **Estructura estática** (script Python propio): etiquetas bien cerradas,
  `lang="es"`, un único `h1` por página, sin saltos de nivel de encabezado,
  ids únicos, `alt` y dimensiones en todas las imágenes, `label` para cada
  control, referencias `aria-*`/`for` existentes, rutas y anclas internas
  válidas, sin rutas absolutas.
- **Contraste** calculado con la fórmula de WCAG 2.x para las combinaciones
  de color usadas (texto ≥ 4,5:1; bordes de campos y foco ≥ 3:1).
- **Navegador** (Chromium headless con Playwright), en 1280, 390 y 320 px:
  sin errores de consola ni peticiones fallidas, sin desplazamiento
  horizontal; menú móvil con teclado; enlace de salto; validaciones del
  formulario (campos vacíos, correo, teléfono, lunes cerrado, cena en
  miércoles, comensales fuera de rango, contador); que el envío válido no
  genera ninguna petición ni pone datos en la URL; visor de galería con
  gestión de foco; funcionamiento sin JavaScript; presencia de los landmarks.

### Qué no se ha comprobado

- No se ha pasado un validador HTML oficial (W3C/Nu) ni axe-core: no estaban
  disponibles en el entorno. Conviene hacerlo antes de publicar.
- No se ha probado en Firefox, Safari ni en dispositivos reales.
- No se ha probado con lectores de pantalla (NVDA, JAWS, VoiceOver, TalkBack).

**WCAG 2.2 AA es un objetivo de desarrollo, no una conformidad declarada.**

### Lista de revisión manual recomendada

- [ ] Validar cada página en https://validator.w3.org/nu/
- [ ] Pasar axe DevTools o Lighthouse (Accesibilidad) en cada página.
- [ ] Recorrer todo el sitio solo con teclado (Tab, Mayús+Tab, Enter, Escape).
- [ ] Probar el formulario con un lector de pantalla.
- [ ] Ampliar al 200 % y al 400 % (reflow a 320 px) sin pérdida de contenido.
- [ ] Activar «reducir movimiento» en el sistema y comprobar que no hay
      animaciones.
- [ ] Probar en Chrome, Firefox y Safari (escritorio y móvil).
- [ ] Sustituir todos los datos provisionales antes de un uso real.
# erreka-sukaldea
