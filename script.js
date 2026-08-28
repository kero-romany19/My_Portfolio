"use strict";

const CONTACT_EMAIL = "keroromany709@gmail.com";

document.addEventListener("DOMContentLoaded", () => {
  const navigationLinks = document.querySelectorAll('a[href^="#"]');
  const contactForm = document.querySelector("#contact form");

  setupSmoothNavigation(navigationLinks);
  setupProjectFilters();
  setupProjectLightbox();
  setupContactForm(contactForm);
});

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
  const closeLightbox = () => lightbox.close();

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
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener("close", () => {
    document.body.style.overflow = "";
  });
}

function setupContactForm(form) {
  if (!form) return;

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
