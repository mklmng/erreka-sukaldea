/**
 * main.js — comportamiento global de Erreka Sukaldea (proyecto de demostración)
 *
 * Mejora progresiva: sin JavaScript la navegación se ve completa y la galería
 * muestra las imágenes con su pie. Este archivo solo añade:
 *   1. Menú móvil plegable y accesible.
 *   2. Año actual en el pie.
 *   3. Visor ampliado de la galería con <dialog> nativo (si el navegador lo admite).
 *
 * Se usa un script clásico con `defer` (no un módulo ES) para que el sitio
 * también funcione abriendo los archivos directamente con file://.
 */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 52em)";

  /* ------------------------------------------------------------------------
     1. Menú móvil
     ------------------------------------------------------------------------ */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;

    var toggle = nav.querySelector(".nav__toggle");
    var list = nav.querySelector(".nav__list");
    if (!toggle || !list) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function setOpen(open, options) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("nav--open", open);
      if (!open && options && options.returnFocus) {
        toggle.focus();
      }
    }

    // Patrón de "disclosure": el foco se queda en el botón y el siguiente
    // Tab entra en la lista recién mostrada.
    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    // Escape cierra el menú y devuelve el foco al botón
    nav.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false, { returnFocus: true });
      }
    });

    // Al salir del menú con el teclado o al pulsar fuera, se cierra
    document.addEventListener("click", function (event) {
      if (isOpen() && !nav.contains(event.target)) setOpen(false);
    });

    nav.addEventListener("focusout", function (event) {
      if (isOpen() && event.relatedTarget && !nav.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });

    // Al pasar a escritorio el estado plegado deja de tener sentido
    if (window.matchMedia) {
      var mq = window.matchMedia(DESKTOP_QUERY);
      var onChange = function (e) {
        if (e.matches) setOpen(false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange); // Safari < 14
    }
  }

  /* ------------------------------------------------------------------------
     2. Año en el pie
     ------------------------------------------------------------------------ */
  function initYear() {
    var year = String(new Date().getFullYear());
    var nodes = document.querySelectorAll("[data-year]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = year;
  }

  /* ------------------------------------------------------------------------
     3. Visor de galería
     ------------------------------------------------------------------------ */
  function initGallery() {
    var gallery = document.querySelector("[data-gallery]");
    if (!gallery) return;

    // Sin <dialog> nativo no se añade nada: las imágenes ya se ven completas
    if (typeof HTMLDialogElement !== "function") return;

    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-labelledby", "lightbox-caption");
    dialog.innerHTML =
      '<button type="button" class="button button--ghost lightbox__close">Cerrar</button>' +
      '<img class="lightbox__img" alt="">' +
      '<p class="lightbox__caption" id="lightbox-caption"></p>';
    document.body.appendChild(dialog);

    var dialogImg = dialog.querySelector(".lightbox__img");
    var dialogCaption = dialog.querySelector(".lightbox__caption");
    var closeBtn = dialog.querySelector(".lightbox__close");
    var lastTrigger = null;

    closeBtn.addEventListener("click", function () {
      dialog.close();
    });

    // Clic en el fondo (fuera de la caja) cierra el visor
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", function () {
      dialogImg.removeAttribute("src");
      if (lastTrigger) lastTrigger.focus();
    });

    var figures = gallery.querySelectorAll(".gallery__figure");
    Array.prototype.forEach.call(figures, function (figure) {
      var media = figure.querySelector(".gallery__media");
      var img = figure.querySelector("img");
      var caption = figure.querySelector("figcaption");
      if (!media || !img) return;

      var captionText = caption ? caption.textContent.trim() : "";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "gallery__open";
      button.innerHTML =
        'Ampliar<span class="visually-hidden">: ' + escapeHtml(captionText || img.alt) + "</span>";

      button.addEventListener("click", function () {
        lastTrigger = button;
        dialogImg.src = img.currentSrc || img.src;
        dialogImg.alt = img.alt;
        dialogCaption.textContent = captionText;
        dialog.showModal();
        closeBtn.focus();
      });

      media.appendChild(button);
    });
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  initNav();
  initYear();
  initGallery();
})();
