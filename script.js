"use strict";

const CONTACT_EMAIL = "keroromany709@gmail.com";

document.addEventListener("DOMContentLoaded", () => {
  const navigationLinks = document.querySelectorAll('a[href^="#"]');
  const contactForm = document.querySelector("#contact form");
  const header = document.querySelector(".site-header");
  const sections = document.querySelectorAll("main section[id]");

  setupSmoothNavigation(navigationLinks);
  setupProjectFilters();
  setupProjectLightbox();
  setupContactForm(contactForm);
  setupStickyHeader(header);
  setupActiveNavigation(navigationLinks, sections);
});

// Keep the header state in one place so scroll behavior stays predictable.
function setupStickyHeader(header) {
  if (!header) return;

  let lastScrollY = window.scrollY;
  const hideThreshold = 8; // ignore tiny scroll jitters

  const updateHeaderState = () => {
    const currentScrollY = window.scrollY;
    header.classList.toggle("is-scrolled", currentScrollY > 18);

    if (currentScrollY <= 0) {
      // back at the very top: always show it
      header.classList.remove("nav-hidden");
    } else if (currentScrollY > lastScrollY + hideThreshold) {
      // scrolling down: slide it up out of view
      header.classList.add("nav-hidden");
    } else if (currentScrollY < lastScrollY - hideThreshold) {
      // scrolling up: bring it back
      header.classList.remove("nav-hidden");
    }

    lastScrollY = currentScrollY;
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

function setupActiveNavigation(links, sections) {
  if (!links.length || !sections.length) return;

  const setActiveLink = (id) => {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  // Update the active navigation item as each section enters the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveLink(visibleEntry.target.id);
      }
    },
    {
      rootMargin: "-30% 0px -45% 0px",
      threshold: [0.1, 0.4, 0.7],
    },
  );

  sections.forEach((section) => observer.observe(section));

  if (window.location.hash) {
    const hashId = window.location.hash.slice(1);
    setActiveLink(hashId);
  }
}

function setupSmoothNavigation(links) {
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetSelector = link.getAttribute("href");
      const target = targetSelector
        ? document.querySelector(targetSelector)
        : null;
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", targetSelector);
    });
  });
}

function setupProjectFilters() {
  const filters = document.querySelectorAll("[data-project-filter]");
  const projects = document.querySelectorAll("#projects .project");

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const selectedCategory =
        filter.dataset.projectFilter?.toLowerCase() || "all";

      projects.forEach((project) => {
        const categories = (project.dataset.category || project.className)
          .toLowerCase()
          .split(/[\s,]+/);
        project.hidden =
          selectedCategory !== "all" && !categories.includes(selectedCategory);
      });

      filters.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === filter));
      });
    });
  });
}

function setupProjectLightbox() {
  const projectImages = document.querySelectorAll("#projects .project img");
  if (!projectImages.length) return;

  const lightbox = document.createElement("dialog");
  lightbox.className = "project-lightbox";
  lightbox.innerHTML = `
    <button type="button" class="project-lightbox-close" aria-label="Close image preview">&times;</button>
    <img class="project-lightbox-image" alt="">
  `;
  document.body.append(lightbox);

  const previewImage = lightbox.querySelector(".project-lightbox-image");
  const closeButton = lightbox.querySelector(".project-lightbox-close");
  let activeProjectImage = null;

  // The CSS hides the dialog while closed; this function owns the state change.
  const closeLightbox = () => {
    if (!lightbox.open) return;

    lightbox.close();
  };

  projectImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute(
      "aria-label",
      `Open larger preview of ${image.alt || "project image"}`,
    );
    image.addEventListener(
      "error",
      () => {
        const fallbackLabel = "Project preview unavailable";
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#111c33"/><text x="400" y="250" fill="#94a3b8" font-family="sans-serif" font-size="28" text-anchor="middle">${fallbackLabel}</text></svg>`;
        image.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(fallbackSvg)}`;
        image.alt = `${image.alt} - ${fallbackLabel.toLowerCase()}`;
        image.removeAttribute("role");
        image.removeAttribute("tabindex");
      },
      { once: true },
    );

    const openLightbox = () => {
      activeProjectImage = image;
      previewImage.src = image.currentSrc || image.src;
      previewImage.alt = image.alt || "Project image";
      lightbox.showModal();
      document.body.style.overflow = "hidden";
      closeButton.focus();
    };

    image.addEventListener("click", openLightbox);
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener("close", () => {
    document.body.style.overflow = "";
    activeProjectImage?.focus();
    activeProjectImage = null;
  });
}

function setupContactForm(form) {
  if (!form) return;

  // Validate on blur for feedback, then validate every field before mailto.
  const fields = [...form.querySelectorAll("input, textarea")];

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.validity.customError) validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!fields.every(validateField)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(
      formData.get("subject") || "Portfolio inquiry",
    ).trim();
    const message = String(formData.get("message") || "").trim();
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showMessageConfirmation(mailtoUrl);
  });
}

function showMessageConfirmation(mailtoUrl) {
  const existingPopup = document.querySelector(".message-confirmation");
  existingPopup?.remove();

  const popup = document.createElement("div");
  popup.className = "message-confirmation";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-labelledby", "confirmation-title");
  popup.innerHTML = `
    <div class="message-confirmation-card">
      <button class="message-confirmation-close" type="button" aria-label="Close confirmation">&times;</button>
      <div class="message-confirmation-icon" aria-hidden="true">&#10003;</div>
      <h2 id="confirmation-title">Message ready</h2>
      <p>Your message was prepared successfully. Continue to your email app to send it.</p>
      <div class="message-confirmation-actions">
        <button class="message-confirmation-send" type="button">Continue to email</button>
        <button class="message-confirmation-cancel" type="button">Cancel</button>
      </div>
    </div>
  `;
  document.body.append(popup);

  const closePopup = () => popup.remove();
  popup
    .querySelector(".message-confirmation-close")
    .addEventListener("click", closePopup);
  popup
    .querySelector(".message-confirmation-cancel")
    .addEventListener("click", closePopup);
  popup
    .querySelector(".message-confirmation-send")
    .addEventListener("click", () => {
      window.location.href = mailtoUrl;
    });
  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });
  popup.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePopup();
  });

  popup.querySelector(".message-confirmation-send").focus();
}

function validateField(field) {
  const value = field.value.trim();
  let errorMessage = "";

  if (!value) {
    errorMessage = "This field is required.";
  } else if (field.type === "email" && field.validity.typeMismatch) {
    errorMessage = "Please enter a valid email address.";
  }

  field.setCustomValidity(errorMessage);
  field.setAttribute("aria-invalid", String(Boolean(errorMessage)));

  let feedback = document.getElementById(`${field.id}-feedback`);
  if (!feedback) {
    feedback = document.createElement("span");
    feedback.id = `${field.id}-feedback`;
    feedback.className = "field-feedback";
    feedback.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", feedback);
  }

  feedback.textContent = errorMessage;
  feedback.hidden = !errorMessage;
  return !errorMessage;
}
