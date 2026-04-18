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
      const payload = { nombre, correo, mensaje };
      const res = await fetch("/enviar-mensaje", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (data && data.estado === "ok") {
        mensajeElemento.textContent = data.mensaje || "Mensaje enviado. Gracias.";
        mensajeElemento.classList.add("form-mensaje--exito");
        form.reset();
      } else {
        mensajeElemento.textContent = data.mensaje || "Error al enviar. Inténtalo más tarde.";
        mensajeElemento.classList.add("form-mensaje--error");
      }
    } catch (err) {
      console.error("Error:", err);
      mensajeElemento.textContent =
        "No se pudo conectar con el servidor de registro. Asegúrate de que el servidor Node.js esté corriendo.";
      mensajeElemento.classList.add("form-mensaje--error");
    } finally {
      if (botonEnviar) {
        botonEnviar.disabled = false;
        if (textoOriginal) botonEnviar.textContent = textoOriginal;
      }
    }
  });

  // --- Modal Galería y Productos (Álbumes) ---
  const modalGaleria = document.querySelector("#modal-galeria");
  const modalImg = document.querySelector("#modal-img");
  const modalTitulo = document.querySelector("#modal-titulo");
  const modalCerrar = document.querySelector("#modal-cerrar");
  const modalPrev = document.querySelector("#modal-prev");
  const modalNext = document.querySelector("#modal-next");
  const modalIndicadores = document.querySelector("#modal-indicadores");
  const albumItems = document.querySelectorAll(".galeria-item, .producto-card");

  let currentAlbum = [];
  let currentAlbumIndex = 0;

  if (modalGaleria && modalImg && modalTitulo && modalCerrar) {
    const updateAlbumContent = (index) => {
      if (currentAlbum.length === 0) return;
      
      modalImg.style.opacity = "0";
      setTimeout(() => {
        modalImg.src = currentAlbum[index];
        modalImg.style.opacity = "1";
      }, 150);
      
      currentAlbumIndex = index;
      
      const puntos = modalIndicadores.querySelectorAll(".modal-punto");
      puntos.forEach((p, i) => {
        p.classList.toggle("activo", i === index);
      });

      if (currentAlbum.length <= 1) {
        modalPrev.style.display = "none";
        modalNext.style.display = "none";
        modalIndicadores.style.display = "none";
      } else {
        modalPrev.style.display = "flex";
        modalNext.style.display = "flex";
        modalIndicadores.style.display = "flex";
      }
    };

    albumItems.forEach((item) => {
      item.addEventListener("click", () => {
        const albumData = item.getAttribute("data-album");
        const titulo = item.querySelector(".galeria-leyenda") || item.querySelector("h3");
        
        if (albumData) {
          currentAlbum = albumData.split(",");
          currentAlbumIndex = 0;
          modalTitulo.textContent = titulo ? titulo.textContent : "";
          
          modalIndicadores.innerHTML = "";
          if (currentAlbum.length > 1) {
            currentAlbum.forEach((_, i) => {
              const punto = document.createElement("div");
              punto.classList.add("modal-punto");
              if (i === 0) punto.classList.add("activo");
              punto.addEventListener("click", () => updateAlbumContent(i));
              modalIndicadores.appendChild(punto);
            });
          }

          updateAlbumContent(0);
          modalGaleria.classList.add("activo");
          modalGaleria.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }
      });
    });

    const nextAlbumImg = () => {
      let nextIndex = (currentAlbumIndex + 1) % currentAlbum.length;
      updateAlbumContent(nextIndex);
    };

    const prevAlbumImg = () => {
      let prevIndex = (currentAlbumIndex - 1 + currentAlbum.length) % currentAlbum.length;
      updateAlbumContent(prevIndex);
    };

    modalNext?.addEventListener("click", (e) => {
      e.stopPropagation();
      nextAlbumImg();
    });

    modalPrev?.addEventListener("click", (e) => {
      e.stopPropagation();
      let prevIndex = (currentAlbumIndex - 1 + currentAlbum.length) % currentAlbum.length;
      updateAlbumContent(prevIndex);
    });

    const cerrarModal = () => {
      modalGaleria.classList.remove("activo");
      modalGaleria.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      setTimeout(() => {
        modalImg.src = "";
        currentAlbum = [];
      }, 300);
    };

    modalCerrar.addEventListener("click", cerrarModal);

    modalGaleria.addEventListener("click", (e) => {
      if (e.target === modalGaleria || e.target.classList.contains("modal-nav-container")) {
        cerrarModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!modalGaleria.classList.contains("activo")) return;
      
      if (e.key === "Escape") cerrarModal();
      if (e.key === "ArrowRight") nextAlbumImg();
      if (e.key === "ArrowLeft") {
        let prevIndex = (currentAlbumIndex - 1 + currentAlbum.length) % currentAlbum.length;
        updateAlbumContent(prevIndex);
      }
    });
  }

  // --- Navegación Galería (Slider) ---
  const galeriaGrid = document.querySelector(".galeria-grid");
  const btnPrev = document.querySelector(".galeria-nav--prev");
  const btnNext = document.querySelector(".galeria-nav--next");

  if (galeriaGrid && btnPrev && btnNext) {
    const scrollAmount = 300; // Cantidad aproximada de scroll

    btnNext.addEventListener("click", () => {
      galeriaGrid.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });

    btnPrev.addEventListener("click", () => {
      galeriaGrid.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    // Ocultar botones si no hay scroll posible (opcional)
    const toggleButtons = () => {
      btnPrev.style.opacity = galeriaGrid.scrollLeft <= 0 ? "0.3" : "1";
      btnPrev.style.pointerEvents = galeriaGrid.scrollLeft <= 0 ? "none" : "auto";
      
      const maxScroll = galeriaGrid.scrollWidth - galeriaGrid.clientWidth;
      btnNext.style.opacity = galeriaGrid.scrollLeft >= maxScroll ? "0.3" : "1";
      btnNext.style.pointerEvents = galeriaGrid.scrollLeft >= maxScroll ? "none" : "auto";
    };

    galeriaGrid.addEventListener("scroll", toggleButtons);
    window.addEventListener("resize", toggleButtons);
    toggleButtons();
  }
});
