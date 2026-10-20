(() => {
  "use strict";

  document.documentElement.classList.add("js");
  const root = document.documentElement;
  document.addEventListener("keydown", () => {
    root.dataset.input = "keyboard";
    document.getAnimations().forEach(animation => animation.cancel());
  }, { capture: true });
  document.addEventListener("pointerdown", () => { root.dataset.input = "pointer"; }, { capture: true, passive: true });
  const canAnimateInteraction = () => root.dataset.input !== "keyboard" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionCurve = "cubic-bezier(0.23, 1, 0.32, 1)";
  const config = window.PORTFOLIO_CONFIG || {};
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const dialog = document.querySelector(".contact-dialog");
  const dialogContent = document.querySelector("#dialog-content");
  const closeButton = dialog.querySelector(".dialog-close");
  const toast = document.querySelector(".toast");
  let toastTimer;
  let lastTrigger;
  let routeBeforeDialog = "#proyectos";
  let currentMessage = "";

  const cleanText = (value, fallback = "") => typeof value === "string" && value.trim() ? value.trim() : fallback;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const httpUrl = value => {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  // Read the real cards as a fallback, so content and external links also work without config.js.
  const projectInfo = Object.fromEntries([...document.querySelectorAll("[data-project-title]")].map(title => {
    const id = title.dataset.projectTitle;
    const card = title.closest(".project-card");
    const custom = config.projects?.[id] || {};
    const description = cleanText(custom.description, card.querySelector("[data-project-description]").textContent.trim());
    const tags = Array.isArray(custom.tags) ? custom.tags.filter(tag => typeof tag === "string" && tag.trim()).slice(0, 6) : [...card.querySelectorAll(".project-tags li")].map(tag => tag.textContent);
    return [id, {
      name: cleanText(custom.name, title.textContent.trim()),
      type: cleanText(custom.type, card.querySelector(".project-type").textContent.trim()),
      description,
      detail: cleanText(custom.detail, description),
      tags,
      url: httpUrl(custom.url) || httpUrl(card.querySelector("[data-project-visit]")?.getAttribute("href")),
    }];
  }));

  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  document.querySelectorAll("[data-social]").forEach(link => {
    const url = httpUrl(config.socials?.[link.dataset.social]);
    if (url) link.href = url;
  });

  function setMenu(open) {
    const isMobileMenu = window.matchMedia("(max-width: 640px)").matches;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
    // Hide closed links from keyboard and assistive technology during the short exit.
    nav.inert = isMobileMenu && !open;
    if (isMobileMenu && !open) nav.setAttribute("aria-hidden", "true");
    else nav.removeAttribute("aria-hidden");
  }
  setMenu(false);

  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    setMenu(false);
    if (window.matchMedia("(max-width: 640px)").matches) {
      const section = document.getElementById(link.hash.slice(1));
      if (section) {
        section.setAttribute("tabindex", "-1");
        section.focus({ preventScroll: true });
        section.addEventListener("blur", () => section.removeAttribute("tabindex"), { once: true });
      }
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".header-inner")) setMenu(false);
  });
  document.addEventListener("focusin", event => {
    if (menuButton.getAttribute("aria-expanded") === "true" && !event.target.closest(".header-inner")) setMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });
  window.matchMedia("(max-width: 640px)").addEventListener("change", () => setMenu(false));

  const sections = [...document.querySelectorAll("main > section[id]")];
  let activeSectionId = "";
  function updateNavigation() {
    const position = window.scrollY + Math.min(180, window.innerHeight / 3);
    const active = [...sections].reverse().find(section => section.offsetTop <= position) || sections[0];
    if (active.id === activeSectionId) return;
    activeSectionId = active.id;
    nav.querySelectorAll("a").forEach(link => {
      if (link.hash === `#${active.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { updateNavigation(); scrollQueued = false; });
  }, { passive: true });

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    if (dialog.open) dialog.querySelector(".dialog-status").textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
  }

  function openDialog(trigger) {
    dialog.querySelector(".dialog-status").textContent = "";
    if (!dialog.open) {
      lastTrigger = trigger || document.activeElement;
      dialog.showModal();
      document.body.classList.add("dialog-open");
      if (canAnimateInteraction()) dialog.animate([{ opacity: .5, transform: "scale(.98) translateY(6px)" }, { opacity: 1, transform: "scale(1) translateY(0)" }], { duration: 180, easing: motionCurve });
    }
    closeButton.focus();
  }

  function setDialogRoute(hash) {
    const isModalHash = /^#(?:proyecto-|todos-los-proyectos)/.test(location.hash);
    if (!isModalHash) routeBeforeDialog = "#proyectos";
    if (location.hash !== hash) history.pushState({ portfolioDialog: true }, "", hash);
  }

  function closeDialog({ restoreRoute = true } = {}) {
    if (!dialog.open) return;
    dialog.close();
    document.body.classList.remove("dialog-open");
    if (restoreRoute && /^#(?:proyecto-|todos-los-proyectos)/.test(location.hash)) {
      history.replaceState(null, "", routeBeforeDialog);
    }
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  }

  closeButton.addEventListener("click", () => closeDialog());
  dialog.addEventListener("cancel", event => { event.preventDefault(); closeDialog(); });
  // Close only when the actual pointer position is outside the dialog box.
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });

  function contactGreeting() {
    const greetingName = cleanText(config.shortName, cleanText(config.name));
    return greetingName && greetingName !== "Tu Nombre" ? `Hola, ${greetingName}.` : "Hola.";
  }

  function contactMessage(plan) {
    const greeting = contactGreeting();
    return plan ? `${greeting} Me interesa el ${plan}. Quisiera conversar sobre mi proyecto.` : `${greeting} Quisiera conversar sobre un proyecto web para mi negocio.`;
  }

  function getWhatsapp(plan) {
    const phone = String(config.whatsapp || "").replace(/\D/g, "");
    return /^\d{10,15}$/.test(phone) ? `https://wa.me/${phone}?text=${encodeURIComponent(contactMessage(plan))}` : "";
  }

  function openContact(plan, trigger, preparedMessage = "") {
    currentMessage = preparedMessage || contactMessage(plan);
    dialogContent.innerHTML = `<span class="dialog-symbol">${icon("whatsapp")}</span><h2 id="dialog-title">Conversemos sobre tu proyecto</h2><p>El contacto directo estará disponible pronto. Puedes copiar tu consulta para tenerla lista.</p><p class="dialog-note" id="contact-message"></p><div class="dialog-actions"><button class="button button-blue" type="button" data-copy-message>${icon("copy")}Copiar mensaje</button><button class="button button-outline" type="button" data-close-dialog>Seguir explorando</button></div>`;
    document.querySelector("#contact-message").textContent = currentMessage;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email || "")) {
      const emailLink = document.createElement("a");
      emailLink.className = "button button-outline";
      emailLink.href = `mailto:${config.email}?subject=${encodeURIComponent(plan || "Consulta de desarrollo web")}&body=${encodeURIComponent(currentMessage)}`;
      emailLink.textContent = "Enviar por correo";
      dialogContent.querySelector(".dialog-actions").append(emailLink);
    }
    openDialog(trigger);
  }

  function openProject(id, trigger, updateRoute = true) {
    const project = projectInfo[id];
    if (!project) return;
    const destination = project.url;
    dialogContent.innerHTML = `<div class="dialog-project-image"></div><p class="dialog-project-type">${escapeHtml(project.type)}</p><h2 id="dialog-title">${escapeHtml(project.name)}</h2><p>${escapeHtml(project.description)}</p><ul class="project-tags" aria-label="Características del proyecto">${project.tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join("")}</ul><p class="dialog-note">${escapeHtml(project.detail)}</p><div class="dialog-actions"></div>`;
    const source = document.querySelector(`[data-project-image="${id}"]`);
    const preview = document.createElement("div");
    preview.className = "sample-crop configured-image";
    preview.append(source.firstElementChild.cloneNode(true));
    dialogContent.querySelector(".dialog-project-image").append(preview);
    const actions = dialogContent.querySelector(".dialog-actions");
    if (destination) {
      const link = document.createElement("a");
      link.className = "button button-blue";
      link.href = destination;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = `Visitar proyecto${icon("external")}<span class="sr-only"> (abre en una nueva pestaña)</span>`;
      actions.append(link);
    } else {
      const button = document.createElement("button");
      button.className = "button button-blue";
      button.type = "button";
      button.dataset.closeDialog = "";
      button.textContent = "Volver a los proyectos";
      actions.append(button);
    }
    if (updateRoute) setDialogRoute(`#proyecto-${id}`);
    openDialog(trigger);
  }

  function openAllProjects(trigger, updateRoute = true) {
    dialogContent.innerHTML = `<span class="dialog-symbol">${icon("code")}</span><h2 id="dialog-title">Todos los proyectos</h2><p>Explora los proyectos seleccionados y conoce sus detalles.</p><div class="project-directory"></div>`;
    const directory = dialogContent.querySelector(".project-directory");
    Object.entries(projectInfo).forEach(([id, project]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "directory-item";
      button.dataset.project = id;
      button.innerHTML = `${escapeHtml(project.name)}${icon("arrow")}`;
      directory.append(button);
    });
    if (updateRoute) setDialogRoute("#todos-los-proyectos");
    openDialog(trigger);
  }

  async function copyMessage(button) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(currentMessage);
      button.innerHTML = `${icon("check")}Mensaje copiado`;
      showToast("Mensaje copiado. Ya puedes pegarlo en tu conversación.");
    } catch {
      const message = document.querySelector("#contact-message");
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(message);
      selection.removeAllRanges();
      selection.addRange(range);
      showToast("Seleccionamos el mensaje. Usa Copiar en tu dispositivo.");
    }
  }

  document.addEventListener("click", event => {
    const contact = event.target.closest("[data-contact]");
    if (contact) {
      if (getWhatsapp(contact.dataset.plan)) return;
      event.preventDefault();
      setMenu(false);
      openContact(contact.dataset.plan, contact);
      return;
    }
    const project = event.target.closest("[data-project]");
    if (project) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openProject(project.dataset.project, project);
      return;
    }
    const allProjects = event.target.closest("[data-all-projects]");
    if (allProjects && !httpUrl(config.allProjectsUrl)) {
      event.preventDefault();
      openAllProjects(allProjects);
      return;
    }
    if (event.target.closest("[data-close-dialog]")) closeDialog();
    const copyButton = event.target.closest("[data-copy-message]");
    if (copyButton) copyMessage(copyButton);
  });

  // Configuration is optional. Text is always inserted as text, never as HTML.
  const fullName = cleanText(config.name, "Oscar Eduardo Soto Zorrilla");
  const shortName = cleanText(config.shortName, fullName.split(/\s+/).length > 2 ? fullName.split(/\s+/).slice(0, 2).join(" ") : fullName);
  const role = cleanText(config.role, "Desarrollador full stack");
  const initials = shortName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("es-PE");
  document.querySelectorAll("[data-name]").forEach(node => { node.textContent = fullName; });
  document.querySelectorAll("[data-short-name]").forEach(node => { node.textContent = shortName; });
  document.querySelectorAll("[data-role]").forEach(node => { node.textContent = role; });
  document.querySelectorAll("[data-initials]").forEach(node => { node.textContent = initials; });
  document.querySelector("[data-brand]").setAttribute("aria-label", `${shortName}, ir al inicio`);
  document.title = `${fullName} · ${role}`;
  if (cleanText(config.university)) {
    document.querySelector("[data-university]").textContent = config.university.trim();
    document.querySelector("[data-university-line]").hidden = false;
  }
  document.querySelector("[data-year]").textContent = new Intl.DateTimeFormat("es-PE", { year: "numeric", timeZone: "America/Lima" }).format(new Date());

  function replaceImage(slot, source, alt, dimensions, eager = false) {
    if (!slot || !source || typeof source !== "string") return;
    if (/^(?:[a-z]+:|\/\/)/i.test(source) && !httpUrl(source)) return;
    if (slot.firstElementChild?.tagName === "IMG" && slot.firstElementChild.getAttribute("src") === source) {
      slot.firstElementChild.alt = alt;
      slot.hidden = false;
      return;
    }
    const image = new Image();
    image.alt = alt;
    image.width = dimensions[0];
    image.height = dimensions[1];
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    if (eager) image.fetchPriority = "high";
    const wasHidden = slot.hidden;
    const wasConfigured = slot.classList.contains("configured-image");
    image.addEventListener("load", () => { slot.hidden = false; }, { once: true });
    image.addEventListener("error", () => { image.remove(); slot.classList.toggle("configured-image", wasConfigured); slot.replaceChildren(slot._originalPreview); slot.hidden = wasHidden; }, { once: true });
    slot._originalPreview = slot.firstElementChild;
    image.src = source;
    slot.replaceChildren(image);
    slot.classList.add("configured-image");
    // A lazy image inside a hidden container cannot enter the loading viewport.
    slot.hidden = false;
  }
  replaceImage(document.querySelector('[data-image-slot="hero"]'), config.images?.hero, `Retrato de ${fullName}`, [640, 640], true);
  replaceImage(document.querySelector('[data-image-slot="about"]'), config.images?.about, `Foto de perfil de ${fullName}`, [480, 480]);
  Object.entries(projectInfo).forEach(([id, project]) => {
    replaceImage(document.querySelector(`[data-project-image="${id}"]`), config.projects?.[id]?.image, `Vista del proyecto ${project.name}`, [1440, 900]);
    document.querySelector(`[data-project-title="${id}"]`).textContent = project.name;
    document.querySelector(`[data-project-description="${id}"]`).textContent = project.description;
    const card = document.querySelector(`[data-project-title="${id}"]`).closest(".project-card");
    card.querySelector(".project-type").textContent = project.type;
    const tags = card.querySelector(".project-tags");
    if (tags) tags.replaceChildren(...project.tags.map(text => { const tag = document.createElement("li"); tag.textContent = text; return tag; }));
    const visit = card.querySelector("[data-project-visit]");
    visit.href = project.url;
    visit.setAttribute("aria-label", `Visitar ${project.name} (abre en una nueva pestaña)`);
    card.querySelectorAll("a[data-project]").forEach(link => {
      if (link.hasAttribute("aria-label")) link.setAttribute("aria-label", `Ver proyecto ${project.name}`);
    });
  });

  // The presentation uses the same configurable images and content as the project cards.
  const showcaseImage = document.querySelector("[data-showcase-image]");
  const showcaseButtons = [...document.querySelectorAll("[data-showcase]")];
  const showcase = document.querySelector(".hero-browser");
  const showcaseTitle = document.querySelector("[data-showcase-title]");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const showcaseInterval = 10_000;
  let showcaseTimer;
  let showcaseHovered = false;
  let showcaseVisible = true;
  let showcaseAnimation;

  function canRotateShowcase() {
    const focused = showcase.contains(document.activeElement);
    return !motionPreference.matches && !showcaseHovered && !focused && showcaseVisible && !document.hidden && !dialog.open;
  }

  function scheduleShowcase() {
    clearTimeout(showcaseTimer);
    const rotating = canRotateShowcase();
    // Automatic changes stay silent; manual choices are announced while exploring.
    showcaseTitle.setAttribute("aria-live", rotating ? "off" : "polite");
    if (!rotating) return;
    showcaseTimer = setTimeout(() => {
      if (!canRotateShowcase()) return;
      const current = showcaseButtons.findIndex(button => button.dataset.showcase === showcaseImage.dataset.project);
      selectShowcase(showcaseButtons[(current + 1) % showcaseButtons.length].dataset.showcase);
    }, showcaseInterval);
  }
  function updateQuery(name, value) {
    // File URLs cannot rewrite their query in every browser; the visual state still works.
    if (!["http:", "https:"].includes(location.protocol)) return;
    const url = new URL(location.href);
    url.searchParams.set(name, value);
    history.replaceState(null, "", url);
  }
  function selectShowcase(id, updateUrl = true) {
    if (!Object.hasOwn(projectInfo, id)) return;
    const source = document.querySelector(`[data-project-image="${id}"]`);
    showcaseImage.className = "showcase-image sample-crop configured-image";
    const preview = source.firstElementChild.cloneNode(true);
    preview.loading = "eager";
    showcaseImage.replaceChildren(preview);
    showcaseImage.dataset.project = id;
    showcaseImage.href = `#proyecto-${id}`;
    showcaseImage.setAttribute("aria-label", `Ver proyecto ${projectInfo[id].name}`);
    showcaseTitle.textContent = projectInfo[id].name;
    showcaseButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.showcase === id)));
    if (updateUrl) {
      updateQuery("vista", id);
      showcaseAnimation?.cancel();
      if (canAnimateInteraction()) showcaseAnimation = showcaseImage.animate([
        { opacity: .65, transform: "translateY(3px) scale(.99)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ], { duration: 200, easing: motionCurve });
    }
    scheduleShowcase();
  }
  showcaseButtons.forEach(button => button.addEventListener("click", () => selectShowcase(button.dataset.showcase)));
  showcase.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    showcaseHovered = true;
    scheduleShowcase();
  });
  showcase.addEventListener("pointerleave", () => {
    showcaseHovered = false;
    scheduleShowcase();
  });
  showcase.addEventListener("focusin", scheduleShowcase);
  showcase.addEventListener("focusout", () => queueMicrotask(scheduleShowcase));
  document.addEventListener("visibilitychange", scheduleShowcase);
  dialog.addEventListener("close", scheduleShowcase);
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) document.getAnimations().forEach(animation => animation.cancel());
    scheduleShowcase();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      showcaseVisible = entry.isIntersecting;
      scheduleShowcase();
    }, { threshold: 0 }).observe(showcase);
  }
  const initialShowcase = new URL(location.href).searchParams.get("vista");
  selectShowcase(showcaseButtons.some(button => button.dataset.showcase === initialShowcase) ? initialShowcase : "ozon", false);

  // Local drafts and the private follow-up register never confirm a WhatsApp message or booking.
  const demoTabs = [...document.querySelectorAll("[data-demo-tab]")];
  const demoForm = document.querySelector("#demo-reservation");
  const demoName = document.querySelector("#demo-name");
  const demoPhone = document.querySelector("#demo-phone");
  const demoDate = document.querySelector("#demo-date");
  const demoService = document.querySelector("#demo-service");
  const demoFeedback = document.querySelector("[data-demo-feedback]");
  const dateError = document.querySelector("#demo-date-error");
  const nameError = document.querySelector("#demo-name-error");
  const phoneError = document.querySelector("#demo-phone-error");
  const reservationNext = document.querySelector("[data-reservation-next]");
  const reservationLink = document.querySelector("[data-reservation-link]");
  const workbench = document.querySelector(".workbench");
  const reservationButton = demoForm.querySelector('[type="submit"]');
  const reservationCancel = document.querySelector("[data-reservation-cancel]");
  const flowIndicator = document.querySelector("[data-flow-indicator]");
  const reservationSuccess = document.querySelector("[data-reservation-success]");
  const reservationStatus = document.querySelector("[data-reservation-status]");
  const logicStatus = document.querySelector("[data-logic-status]");
  const codeLines = [...document.querySelectorAll("[data-code-line]")];
  let activeReservation = null;
  const initialReservationFeedback = demoFeedback.textContent;
  const today = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Lima" }).format(new Date());
  const dateFormatter = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const records = [];
  demoDate.min = today;
  demoDate.value = today;
  demoForm.noValidate = true;
  demoForm.hidden = false;

  function selectDemo(id, focus = false, updateUrl = true, fromFlow = false) {
    if (!demoTabs.some(tab => tab.dataset.demoTab === id)) return;
    if (activeReservation && !fromFlow) cancelReservationFlow();
    demoTabs.forEach(tab => {
      const selected = tab.dataset.demoTab === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
      if (selected && focus) tab.focus();
    });
    if (updateUrl) {
      updateQuery("demo", id);
    }
  }
  demoTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectDemo(tab.dataset.demoTab));
    tab.addEventListener("keydown", event => {
      const next = event.key === "ArrowRight" ? (index + 1) % demoTabs.length : event.key === "ArrowLeft" ? (index + demoTabs.length - 1) % demoTabs.length : event.key === "Home" ? 0 : event.key === "End" ? demoTabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      selectDemo(demoTabs[next].dataset.demoTab, true);
    });
  });
  function validarReserva(nombre, fecha, hoy) {
    if (!nombre.trim() || !fecha) return "Completa tus datos";
    if (fecha < hoy) return "Elige hoy o después";
    return "ok";
  }
  function normalizePhone(value) {
    const raw = value.trim();
    if (!raw) return "";
    if (raw.length > 32 || !/^\+?[\d\s().-]+$/.test(raw)) return null;
    let digits = raw.replace(/\D/g, "");
    if (/^9\d{8}$/.test(digits)) digits = `51${digits}`;
    else if (digits.startsWith("00")) digits = digits.slice(2);
    else if (!raw.startsWith("+") && !/^519\d{8}$/.test(digits)) return null;
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  function renderRecords(highlightFirst = false) {
    const list = document.querySelector("[data-demo-records]");
    list.replaceChildren();
    records.forEach((record, index) => {
      const row = document.createElement("tr");
      if (index === 0 && highlightFirst) row.className = "record-new";
      const service = document.createElement("td");
      const date = document.createElement("td");
      const name = document.createElement("td");
      name.textContent = record.name;
      if (record.phone) {
        const phone = document.createElement("small");
        phone.className = "record-phone";
        phone.textContent = `Celular: ${record.phone}`;
        name.append(phone);
      }
      service.textContent = record.service;
      date.textContent = dateFormatter.format(new Date(`${record.date}T12:00:00Z`));
      row.append(name, service, date);
      list.append(row);
    });
    document.querySelector("[data-record-count]").textContent = records.length;
    document.querySelector("[data-data-empty]").hidden = records.length > 0;
    document.querySelector("[data-data-table]").hidden = records.length === 0;
  }
  function setReservationBusy(busy) {
    workbench.classList.toggle("is-processing", busy);
    demoForm.setAttribute("aria-busy", String(busy));
    [demoName, demoPhone, demoDate, demoService, reservationButton].forEach(control => { control.disabled = busy; });
    reservationCancel.hidden = !busy;
    flowIndicator.hidden = busy;
    if (!busy) workbench.style.removeProperty("--flow-panel-height");
  }

  function clearCodeHighlight() {
    codeLines.forEach(line => line.classList.remove("is-active", "is-complete", "is-valid"));
  }

  function cancelReservationFlow() {
    if (!activeReservation) return;
    const flow = activeReservation;
    activeReservation = null;
    flow.controller.abort();
    setReservationBusy(false);
    clearCodeHighlight();
    logicStatus.textContent = "Recorrido detenido. Puedes preparar otra solicitud.";
    if (flow.prepared) reservationStatus.textContent = "Solicitud lista. Puedes abrir WhatsApp cuando quieras.";
    else reservationSuccess.hidden = true;
  }

  function waitForReservationStep(duration, signal) {
    return new Promise(resolve => {
      if (signal.aborted) return resolve(false);
      const cancel = () => { clearTimeout(timer); resolve(false); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(true); }, duration);
      signal.addEventListener("abort", cancel, { once: true });
    });
  }

  async function registerReservation(record, signal) {
    if (!/^https?:$/.test(location.protocol) || signal.aborted) return false;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    const timeout = setTimeout(cancel, 8000);
    signal.addEventListener("abort", cancel, { once: true });
    try {
      const response = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ ...record, website: demoForm.elements.website.value }),
      });
      if (!response.ok) return false;
      const result = await response.json();
      return result.ok === true && result.recorded === true && result.requestId === record.requestId;
    } catch { return false; }
    finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
    }
  }

  async function runReservationFlow(record, destination) {
    clearPreparedReservation();
    clearCodeHighlight();
    const flow = { controller: new AbortController(), prepared: false, animate: canAnimateInteraction() };
    activeReservation = flow;
    const { signal } = flow.controller;
    const panelHeight = document.querySelector(".demo-panel:not([hidden])").getBoundingClientRect().height;
    workbench.style.setProperty("--flow-panel-height", `${Math.ceil(panelHeight)}px`);
    setReservationBusy(true);
    try {
      selectDemo("logica", true, true, true);
      logicStatus.textContent = "Comprobando los datos de tu solicitud…";
      if (flow.animate && !motionPreference.matches) {
        for (let index = 0; index < codeLines.length && !motionPreference.matches; index++) {
          codeLines.forEach((line, position) => {
            line.classList.toggle("is-active", position === index);
            line.classList.toggle("is-complete", position < index);
            line.classList.toggle("is-valid", position === index && index === codeLines.length - 1);
          });
          if (!await waitForReservationStep(180, signal)) return;
        }
      }
      if (signal.aborted) return;
      logicStatus.textContent = "Validación correcta. Nombre, servicio y fecha listos.";
      reservationLink.href = destination;
      reservationNext.hidden = false;
      records.unshift(record);
      if (records.length > 5) records.pop();
      renderRecords(true);
      flow.prepared = true;
      reservationSuccess.hidden = false;
      reservationStatus.textContent = "Datos listos. Abriendo WhatsApp en otra pestaña…";
      demoFeedback.classList.add("is-success");
      demoFeedback.textContent = "Solicitud preparada. Pulsa Enviar en WhatsApp para que me llegue. La fecha queda pendiente de confirmación.";
      selectDemo("datos", true, true, true);
      reservationStatus.textContent = "Registrando tu solicitud antes de abrir WhatsApp…";
      const [recorded, ready] = await Promise.all([
        registerReservation(record, signal),
        waitForReservationStep(flow.animate && !motionPreference.matches ? 850 : 350, signal),
      ]);
      if (!ready || signal.aborted) return;
      if (dialog.open) { cancelReservationFlow(); return; }
      reservationStatus.textContent = recorded
        ? "Solicitud registrada. Envía el mensaje en WhatsApp para coordinar la fecha."
        : "No pude confirmar el registro. Puedes continuar por WhatsApp para que reciba tu consulta.";
      // Keep the portfolio and its prepared request open while WhatsApp uses another tab.
      window.open(destination, "_blank", "noopener,noreferrer");
    } catch {
      reservationStatus.textContent = "Tu solicitud está lista. Continúa con el enlace Abrir WhatsApp.";
    } finally {
      if (activeReservation === flow) {
        activeReservation = null;
        setReservationBusy(false);
      }
    }
  }

  demoForm.addEventListener("submit", event => {
    event.preventDefault();
    if (activeReservation) return;
    const name = demoName.value.trim().replace(/\s+/g, " ");
    const phone = normalizePhone(demoPhone.value);
    const nameMessage = !name ? "Escribe tu nombre." : name.length > 80 ? "Usa hasta 80 caracteres." : "";
    const phoneMessage = phone === null ? "Revisa el celular. Si no es de Perú, incluye + y el código de país." : "";
    const dateMessage = !demoDate.value ? "Elige una fecha." : demoDate.value < today ? "Elige hoy o después." : "";
    const result = validarReserva(name, demoDate.value, today);
    nameError.textContent = nameMessage;
    nameError.hidden = !nameMessage;
    demoName.setAttribute("aria-invalid", String(Boolean(nameMessage)));
    phoneError.textContent = phoneMessage;
    phoneError.hidden = !phoneMessage;
    demoPhone.setAttribute("aria-invalid", String(Boolean(phoneMessage)));
    dateError.textContent = dateMessage;
    dateError.hidden = !dateMessage;
    demoDate.setAttribute("aria-invalid", String(Boolean(dateMessage)));
    logicStatus.textContent = result === "ok" && !nameMessage && !phoneMessage ? "Validación correcta: datos listos para preparar la solicitud." : `Validación: ${nameMessage || phoneMessage || dateMessage}`;
    if (nameMessage || phoneMessage || result !== "ok") {
      demoFeedback.classList.remove("is-success");
      demoFeedback.textContent = nameMessage || phoneMessage || "Revisa la fecha para continuar.";
      (nameMessage ? demoName : phoneMessage ? demoPhone : demoDate).focus();
      return;
    }
    demoName.value = name;
    const requestId = [...crypto.getRandomValues(new Uint8Array(16))].map(value => value.toString(16).padStart(2, "0")).join("");
    const requestedDate = dateFormatter.format(new Date(`${demoDate.value}T12:00:00Z`));
    const message = `${contactGreeting()}\n\nQuisiera coordinar una conversación sobre mi proyecto.\nNombre: ${name}${phone ? `\nCelular: ${phone}` : ""}\nServicio: ${demoService.value}\nFecha preferida: ${requestedDate} (Perú).\nReferencia: OS-${requestId.slice(0, 8).toUpperCase()}\n\n¿Tienes disponibilidad ese día?`;
    const destination = getWhatsapp();
    if (!destination) {
      openContact("", demoForm.querySelector('[type="submit"]'), message);
      return;
    }
    const whatsappUrl = new URL(destination);
    whatsappUrl.searchParams.set("text", message);
    runReservationFlow({ name, phone, service: demoService.value, date: demoDate.value, requestId }, whatsappUrl.href);
  });
  function clearPreparedReservation() {
    cancelReservationFlow();
    reservationNext.hidden = true;
    reservationLink.removeAttribute("href");
    reservationSuccess.hidden = true;
    demoFeedback.classList.remove("is-success");
    demoFeedback.textContent = initialReservationFeedback;
  }
  demoDate.addEventListener("input", () => {
    dateError.hidden = true;
    demoDate.removeAttribute("aria-invalid");
    clearPreparedReservation();
  });
  demoName.addEventListener("input", () => {
    nameError.textContent = "";
    nameError.hidden = true;
    demoName.removeAttribute("aria-invalid");
    clearPreparedReservation();
  });
  demoPhone.addEventListener("input", () => {
    phoneError.textContent = "";
    phoneError.hidden = true;
    demoPhone.removeAttribute("aria-invalid");
    clearPreparedReservation();
  });
  demoService.addEventListener("change", clearPreparedReservation);
  reservationCancel.addEventListener("click", () => {
    cancelReservationFlow();
    selectDemo("vista", true);
    reservationButton.focus();
  });
  workbench.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !activeReservation) return;
    event.preventDefault();
    cancelReservationFlow();
    selectDemo("vista", true);
    reservationButton.focus();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelReservationFlow(); });
  document.querySelector("[data-demo-return]").addEventListener("click", () => { selectDemo("vista"); demoService.focus(); });
  document.querySelector("[data-demo-reset]").addEventListener("click", () => {
    records.length = 0;
    renderRecords();
    demoFeedback.classList.remove("is-success");
    clearPreparedReservation();
    demoFeedback.textContent = "Historial del navegador borrado. El registro privado y los mensajes de WhatsApp se gestionan por separado.";
    selectDemo("vista", true);
  });
  selectDemo(new URL(location.href).searchParams.get("demo") || "vista", false, false);

  // Work stays readable on scroll; only the opening composition and explicit actions move.

  const testimonialList = document.querySelector("[data-testimonials-list]");
  const testimonials = Array.isArray(config.testimonials) ? config.testimonials.filter(item => cleanText(item?.quote) && cleanText(item?.name)) : [];
  testimonials.forEach(item => {
    const figure = document.createElement("figure");
    figure.className = "testimonial";
    const quote = document.createElement("blockquote");
    quote.textContent = `“${item.quote.trim()}”`;
    const caption = document.createElement("figcaption");
    const author = document.createElement("strong");
    author.textContent = item.name.trim();
    const context = document.createElement("span");
    context.textContent = cleanText(item.context);
    caption.append(author, context);
    figure.append(quote, caption);
    testimonialList.append(figure);
  });
  document.querySelector("[data-testimonials-section]").hidden = testimonials.length === 0;

  document.querySelectorAll("[data-contact]").forEach(link => {
    const destination = getWhatsapp(link.dataset.plan);
    if (destination) {
      link.href = destination;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const hint = document.createElement("span");
      hint.className = "sr-only";
      hint.textContent = " (abre WhatsApp en una nueva pestaña)";
      link.append(hint);
    }
  });
  const contactPhone = String(config.whatsapp || "").replace(/\D/g, "");
  document.querySelector("[data-whatsapp-note]").hidden = !getWhatsapp();
  if (contactPhone) {
    document.querySelector("[data-whatsapp-number]").textContent = /^51\d{9}$/.test(contactPhone)
      ? `+51 ${contactPhone.slice(2, 5)} ${contactPhone.slice(5, 8)} ${contactPhone.slice(8)}`
      : `+${contactPhone}`;
  }
  const allProjectsUrl = httpUrl(config.allProjectsUrl);
  if (allProjectsUrl) {
    const link = document.querySelector("[data-all-projects]");
    link.href = allProjectsUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Ver todos los proyectos (abre en una nueva pestaña)");
  }

  function syncHash() {
    const projectMatch = location.hash.match(/^#proyecto-([a-z0-9-]+)$/);
    if (projectMatch && Object.hasOwn(projectInfo, projectMatch[1])) openProject(projectMatch[1], null, false);
    else if (location.hash === "#todos-los-proyectos") openAllProjects(null, false);
    else closeDialog({ restoreRoute: false });
  }
  window.addEventListener("hashchange", syncHash);
  syncHash();
  updateNavigation();
})();
