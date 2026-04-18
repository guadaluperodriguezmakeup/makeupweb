document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#nav-principal");
  const botonReserva = document.querySelector(".boton-reserva");
  const form = document.querySelector("#form-contacto");
  const mensajeElemento = document.querySelector("#form-mensaje");
  const hero = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero-inner");
  const yearEl = document.querySelector("#year");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function cerrarNav() {
    if (header && navToggle && nav) {
      header.classList.remove("nav-abierto");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menú");
      document.body.style.overflow = "";
    }
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const abierto = header.classList.toggle("nav-abierto");
      navToggle.setAttribute("aria-expanded", abierto ? "true" : "false");
      navToggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
      document.body.style.overflow = abierto ? "hidden" : "";
    });

    nav.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => cerrarNav());
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("nav-abierto")) {
        cerrarNav();
      }
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero && heroInner && !reduceMotion) {
    let ticking = false;
    function actualizarEscala() {
      const h = hero.offsetHeight;
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / (h * 0.75), 1);
      const scale = 1 - progress * 0.12;
      heroInner.style.transform = `scale(${scale})`;
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(actualizarEscala);
          ticking = true;
        }
      },
      { passive: true }
    );
    actualizarEscala();
  }

  if (botonReserva && form) {
    botonReserva.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#contacto")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  if (!form || !mensajeElemento) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = form.nombre.value.trim();
    const correo = form.correo.value.trim();
    const mensaje = form.mensaje.value.trim();

    mensajeElemento.textContent = "";
    mensajeElemento.classList.remove("form-mensaje--error", "form-mensaje--exito");

    if (!nombre || !correo || !mensaje) {
      mensajeElemento.textContent = "Por favor, completa todos los campos.";
      mensajeElemento.classList.add("form-mensaje--error");
      return;
    }

    const botonEnviar = form.querySelector(".boton-enviar");
    const textoOriginal = botonEnviar?.textContent;
    if (botonEnviar) {
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando…";
    }

    try {
      const body = new FormData(form);
      const res = await fetch(form.action, {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      if (data && data.estado === "ok") {
        mensajeElemento.textContent = data.mensaje || "Mensaje enviado. Gracias.";
        mensajeElemento.classList.add("form-mensaje--exito");
        form.reset();
      } else if (data && data.estado === "error") {
        mensajeElemento.textContent =
          data.mensaje || "No se pudo enviar. Configura el servidor o inténtalo más tarde.";
        mensajeElemento.classList.add("form-mensaje--error");
      } else if (res.ok) {
        mensajeElemento.textContent =
          "Mensaje recibido. Si no ves confirmación del servidor, revisa la configuración de correo.";
        mensajeElemento.classList.add("form-mensaje--exito");
        form.reset();
      } else {
        mensajeElemento.textContent =
          "Error al enviar. Comprueba que el formulario esté en un servidor con PHP o contacta por WhatsApp.";
        mensajeElemento.classList.add("form-mensaje--error");
      }
    } catch {
      mensajeElemento.textContent =
        "No hay conexión con el servidor (¿abriste el HTML directamente?). Usa un servidor local o escribe por WhatsApp.";
      mensajeElemento.classList.add("form-mensaje--error");
    } finally {
      if (botonEnviar) {
        botonEnviar.disabled = false;
        if (textoOriginal) botonEnviar.textContent = textoOriginal;
      }
    }
  });

  // --- Modal Galería ---
  const modalGaleria = document.querySelector("#modal-galeria");
  const modalImg = document.querySelector("#modal-img");
  const modalTitulo = document.querySelector("#modal-titulo");
  const modalCerrar = document.querySelector("#modal-cerrar");
  const galeriaItems = document.querySelectorAll(".galeria-item");

  if (modalGaleria && modalImg && modalTitulo && modalCerrar) {
    galeriaItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const leyenda = item.querySelector(".galeria-leyenda");

        if (img) {
          modalImg.src = img.src;
          modalImg.alt = img.alt;
          modalTitulo.textContent = leyenda ? leyenda.textContent : "";
          modalGaleria.classList.add("activo");
          modalGaleria.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden"; // Evitar scroll al estar abierto
        }
      });
    });

    const cerrarModal = () => {
      modalGaleria.classList.remove("activo");
      modalGaleria.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      // Limpiar src para evitar que se vea la imagen anterior al abrir de nuevo
      setTimeout(() => {
        modalImg.src = "";
      }, 300);
    };

    modalCerrar.addEventListener("click", cerrarModal);

    // Cerrar al hacer clic fuera de la imagen
    modalGaleria.addEventListener("click", (e) => {
      if (e.target === modalGaleria) {
        cerrarModal();
      }
    });

    // Cerrar con tecla Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalGaleria.classList.contains("activo")) {
        cerrarModal();
      }
    });
  }
});
