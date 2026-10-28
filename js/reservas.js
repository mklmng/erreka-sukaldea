/**
 * reservas.js — validación del formulario de solicitud de reserva
 *
 * IMPORTANTE: este sitio no tiene servicio de recepción. El script valida los
 * datos en el navegador y muestra un resumen, pero NO envía nada a ningún
 * servidor ni guarda los datos. Para recibir solicitudes reales hay que
 * conectar un servicio (ver README.md, sección «Conectar el formulario»).
 *
 * Mejora progresiva: sin JavaScript los botones permanecen ocultos y se
 * muestra un aviso <noscript>, para no simular un envío que no ocurre.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-reservas]");
  if (!form) return;

  /* ---- Reglas del negocio (provisionales, ficticias) --------------------- */
  var RULES = {
    maxDaysAhead: 90,
    minGuests: 1,
    maxGuests: 8,
    maxNotes: 500,
    // getDay(): 0 domingo … 6 sábado
    lunchDays: [0, 3, 4, 5, 6],
    dinnerDays: [4, 5, 6],
    dinnerFrom: "20:00"
  };

  var DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  var errorSummary = document.getElementById("resumen-errores");
  var errorList = errorSummary ? errorSummary.querySelector("[data-error-list]") : null;
  var result = document.getElementById("resultado");
  var summary = result ? result.querySelector("[data-summary]") : null;
  var counter = form.querySelector("[data-counter]");
  var counterLive = form.querySelector("[data-counter-live]");

  var fields = {
    nombre: form.elements.nombre,
    email: form.elements.email,
    telefono: form.elements.telefono,
    fecha: form.elements.fecha,
    hora: form.elements.hora,
    comensales: form.elements.comensales,
    observaciones: form.elements.observaciones,
    entiendo: form.elements.entiendo
  };

  var labels = {
    nombre: "Nombre y apellidos",
    email: "Correo electrónico",
    telefono: "Teléfono",
    fecha: "Fecha",
    hora: "Hora",
    comensales: "Comensales",
    observaciones: "Observaciones",
    entiendo: "Confirmación de que es una solicitud"
  };

  // Campos que la persona ya ha visitado: solo validamos al salir de ellos
  var touched = {};

  /* ---- Utilidades de fecha (siempre en hora local) ----------------------- */
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseISODate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return null;
    var date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    // Rechaza fechas imposibles como 2026-02-31
    if (date.getMonth() !== Number(m[2]) - 1) return null;
    return date;
  }

  function today() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function addDays(date, days) {
    var copy = new Date(date.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  /* ---- Validadores: devuelven "" si es válido o el mensaje de error ------- */
  var validators = {
    nombre: function (v) {
      v = v.trim();
      if (!v) return "Escribe tu nombre y apellidos.";
      if (v.length < 2) return "El nombre debe tener al menos 2 caracteres.";
      return "";
    },

    email: function (v) {
      v = v.trim();
      if (!v) return "Escribe tu correo electrónico.";
      // Comprobación razonable, no exhaustiva, del formato
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return "El correo no tiene un formato válido. Ejemplo: nombre@dominio.es";
      }
      return "";
    },

    telefono: function (v) {
      v = v.trim();
      if (!v) return ""; // opcional
      if (!/^[+\d\s().-]+$/.test(v)) {
        return "El teléfono solo puede contener cifras, espacios, guiones, paréntesis y el signo +.";
      }
      var digits = v.replace(/\D/g, "").length;
      if (digits < 9 || digits > 15) return "El teléfono debe tener entre 9 y 15 cifras.";
      return "";
    },

    fecha: function (v) {
      if (!v) return "Elige una fecha.";
      var date = parseISODate(v);
      if (!date) return "La fecha no es válida. Usa el formato día, mes y año.";
      var t = today();
      if (date < t) return "Esa fecha ya ha pasado. Elige hoy o un día posterior.";
      if (date > addDays(t, RULES.maxDaysAhead)) {
        return "Solo aceptamos solicitudes con un máximo de " + RULES.maxDaysAhead + " días de antelación.";
      }
      if (RULES.lunchDays.indexOf(date.getDay()) === -1) {
        return "Los " + DAY_NAMES[date.getDay()] + " el restaurante está cerrado. Abrimos de miércoles a domingo.";
      }
      return "";
    },

    hora: function (v) {
      if (!v) return "Elige una hora.";
      var date = parseISODate(fields.fecha.value);
      // La compatibilidad con la fecha solo se comprueba si la fecha es válida
      if (date && !validators.fecha(fields.fecha.value)) {
        var isDinner = v >= RULES.dinnerFrom;
        if (isDinner && RULES.dinnerDays.indexOf(date.getDay()) === -1) {
          return "Los " + DAY_NAMES[date.getDay()] + " no hay servicio de cenas. Elige una hora de comida (13:30 a 15:00).";
        }
        if (date.getTime() === today().getTime()) {
          var now = new Date();
          var nowHM = pad(now.getHours()) + ":" + pad(now.getMinutes());
          if (v <= nowHM) return "Esa hora de hoy ya ha pasado. Elige una hora posterior u otro día.";
        }
      }
      return "";
    },

    comensales: function (v) {
      v = String(v).trim();
      if (!v) return "Indica el número de comensales.";
      if (!/^\d+$/.test(v)) return "Escribe el número de comensales en cifras, sin decimales.";
      var n = Number(v);
      if (n < RULES.minGuests || n > RULES.maxGuests) {
        return "El número de comensales debe estar entre " + RULES.minGuests + " y " + RULES.maxGuests +
          ". Para grupos mayores, indícalo en observaciones con un número menor y te contactaremos.";
      }
      return "";
    },

    observaciones: function (v) {
      if (v.length > RULES.maxNotes) {
        return "Las observaciones no pueden superar " + RULES.maxNotes + " caracteres.";
      }
      return "";
    },

    entiendo: function (_v, el) {
      return el.checked ? "" : "Marca la casilla para confirmar que entiendes que es una solicitud y no una reserva.";
    }
  };

  /* ---- Mostrar y limpiar errores ---------------------------------------- */
  function setFieldError(name, message) {
    var el = fields[name];
    var errorEl = document.getElementById(name + "-error");
    var wrapper = el.closest ? el.closest(".form__field") : null;

    if (message) {
      el.setAttribute("aria-invalid", "true");
      if (errorEl) errorEl.textContent = "Error: " + message;
      if (wrapper) wrapper.classList.add("form__field--invalid");
    } else {
      el.removeAttribute("aria-invalid");
      if (errorEl) errorEl.textContent = "";
      if (wrapper) wrapper.classList.remove("form__field--invalid");
    }
  }

  function validateField(name) {
    var el = fields[name];
    var message = validators[name](el.value, el);
    setFieldError(name, message);
    return message;
  }

  function validateAll() {
    var errors = [];
    Object.keys(fields).forEach(function (name) {
      var message = validateField(name);
      if (message) errors.push({ name: name, message: message });
    });
    return errors;
  }

  function showErrorSummary(errors) {
    if (!errorSummary || !errorList) return;
    errorList.innerHTML = "";
    errors.forEach(function (err) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + fields[err.name].id;
      a.textContent = labels[err.name] + ": " + err.message;
      a.addEventListener("click", function (event) {
        event.preventDefault();
        fields[err.name].focus();
      });
      li.appendChild(a);
      errorList.appendChild(li);
    });
    var title = errorSummary.querySelector(".notice__title");
    if (title) {
      title.textContent = errors.length === 1
        ? "Hay 1 campo que revisar"
        : "Hay " + errors.length + " campos que revisar";
    }
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function hideErrorSummary() {
    if (errorSummary) errorSummary.hidden = true;
  }

  /* ---- Resumen de la solicitud (sin envío) ------------------------------- */
  function addRow(dl, term, value) {
    var row = document.createElement("div");
    row.className = "info-list__row";
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value; // textContent: nunca se inserta HTML del usuario
    row.appendChild(dt);
    row.appendChild(dd);
    dl.appendChild(row);
  }

  function showResult() {
    if (!result || !summary) return;
    var date = parseISODate(fields.fecha.value);
    var dateText = date
      ? date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : fields.fecha.value;

    summary.innerHTML = "";
    addRow(summary, "Nombre", fields.nombre.value.trim());
    addRow(summary, "Correo", fields.email.value.trim());
    addRow(summary, "Teléfono", fields.telefono.value.trim() || "No indicado");
    addRow(summary, "Fecha y hora", dateText + ", a las " + fields.hora.value);
    addRow(summary, "Comensales", fields.comensales.value.trim());
    addRow(summary, "Observaciones", fields.observaciones.value.trim() || "Ninguna");

    result.hidden = false;
    result.focus();
  }

  function hideResult() {
    if (result) result.hidden = true;
  }

  /* ---- Contador de caracteres ------------------------------------------- */
  var lastAnnounced = null;

  function updateCounter() {
    if (!counter) return;
    var length = fields.observaciones.value.length;
    var remaining = RULES.maxNotes - length;
    counter.textContent = length + " de " + RULES.maxNotes + " caracteres";

    // Solo se anuncia al lector de pantalla en umbrales concretos
    if (!counterLive) return;
    var threshold = remaining <= 0 ? 0 : remaining <= 20 ? 20 : remaining <= 50 ? 50 : null;
    if (threshold !== null && threshold !== lastAnnounced) {
      counterLive.textContent = remaining <= 0
        ? "Has alcanzado el máximo de " + RULES.maxNotes + " caracteres."
        : "Quedan " + remaining + " caracteres.";
    }
    lastAnnounced = threshold;
  }

  /* ---- Inicialización ---------------------------------------------------- */
  function init() {
    // Desde aquí la validación la hace este script, con mensajes en español
    form.noValidate = true;

    var t = today();
    fields.fecha.min = toISODate(t);
    fields.fecha.max = toISODate(addDays(t, RULES.maxDaysAhead));

    var buttons = form.querySelectorAll("[data-submit], [data-reset]");
    Array.prototype.forEach.call(buttons, function (b) {
      b.hidden = false;
    });

    Object.keys(fields).forEach(function (name) {
      var el = fields[name];
      var eventName = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur";

      el.addEventListener(eventName, function () {
        // Pasar por un campo vacío con el tabulador no muestra un error:
        // los obligatorios vacíos se señalan al enviar.
        if (eventName === "blur" && !el.value && el.getAttribute("aria-invalid") !== "true") return;
        touched[name] = true;
        validateField(name);
        if (name === "fecha" && touched.hora) validateField("hora");
      });

      // Si ya había un error, se revisa mientras se corrige
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true") validateField(name);
        hideResult();
      });
    });

    fields.observaciones.addEventListener("input", updateCounter);
    updateCounter();

    form.addEventListener("submit", function (event) {
      event.preventDefault(); // No hay servicio de recepción: nunca se envía
      var errors = validateAll();
      if (errors.length) {
        hideResult();
        showErrorSummary(errors);
        return;
      }
      hideErrorSummary();
      showResult();
    });

    form.addEventListener("reset", function () {
      // Se espera a que el navegador restablezca los valores
      window.setTimeout(function () {
        Object.keys(fields).forEach(function (name) {
          setFieldError(name, "");
          touched[name] = false;
        });
        hideErrorSummary();
        hideResult();
        lastAnnounced = null;
        updateCounter();
        fields.nombre.focus();
      }, 0);
    });
  }

  init();
})();
