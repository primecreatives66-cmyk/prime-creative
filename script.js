const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const revealItems = document.querySelectorAll(".reveal");
const header = document.querySelector("[data-header], .site-header");
let themeToggle = document.querySelector("[data-theme-toggle]");

if (!themeToggle && header) {
  themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.setAttribute("data-theme-toggle", "");
  themeToggle.setAttribute("aria-label", "Toggle dark and light mode");
  themeToggle.innerHTML = '<span aria-hidden="true"></span>';
  header.insertBefore(themeToggle, header.querySelector(".nav-cta, .menu-button"));
}

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("primeCreativeTheme", theme);
};

const savedTheme = localStorage.getItem("primeCreativeTheme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

let cmsData = null;
let backendAvailable = false;

const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

const getAdminPassword = () => {
  let password = sessionStorage.getItem("primeAdminPassword");
  if (!password && document.body.classList.contains("admin-body")) {
    password = window.prompt("Enter admin password to save changes") || "";
    if (password) sessionStorage.setItem("primeAdminPassword", password);
  }
  return password;
};

const adminRequest = (path, options = {}) => apiRequest(path, {
  ...options,
  headers: {
    "x-admin-password": getAdminPassword(),
    ...(options.headers || {}),
  },
});

const loadCmsData = async () => {
  try {
    cmsData = await apiRequest("/api/cms");
    backendAvailable = true;
    document.querySelector("[data-cms-status]")?.replaceChildren("Backend connected");
  } catch {
    backendAvailable = false;
    document.querySelector("[data-cms-status]")?.replaceChildren("Static fallback");
  }
  return cmsData;
};

requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(current);
});

menuButton?.addEventListener("click", () => {
  menu?.classList.toggle("is-open");
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => menu.classList.remove("is-open"));
});

revealItems.forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index % 6, 5) * 80}ms`);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => observer.observe(item));

const syncHeader = () => {
  header?.classList.toggle("has-scrolled", window.scrollY > 16);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

document.querySelectorAll(".hero-system, .case-tile, .course-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${y * -2}deg) rotateY(${x * 2}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const bookingServices = {
  web: {
    title: "Web Development",
    copy: "Premium websites, landing pages and listing platforms.",
    options: [
      ["Landing Page", "From NGN 250,000", "Single-page campaign or offer page."],
      ["Business Website", "From NGN 500,000", "Multi-page company website with contact flow."],
      ["Real Estate / Listing Platform", "From NGN 1,200,000", "Property listings, details, inquiries and admin-ready structure."],
    ],
  },
  app: {
    title: "App Development",
    copy: "Custom tools, dashboards, MVPs and workflow platforms.",
    options: [
      ["MVP Web App", "From NGN 1,500,000", "Core product flow, interface and launch-ready prototype."],
      ["Business Dashboard", "From NGN 1,000,000", "Internal tool for managing operations or content."],
      ["Full Product Build", "Quote after scope", "Custom platform priced after discovery."],
    ],
  },
  ai: {
    title: "AI & Automation",
    copy: "AI assistants, workflow automation and business support systems.",
    options: [
      ["AI Chatbot", "From NGN 450,000", "Website or business assistant for FAQs and lead capture."],
      ["Workflow Automation", "From NGN 350,000", "Connect repetitive tasks into a smoother process."],
      ["Custom AI System", "Quote after scope", "Special AI build based on business requirements."],
    ],
  },
  production: {
    title: "Creative Production",
    copy: "Cinematic video production for brands, products, campaigns and events.",
    options: [
      ["Social Content Shoot", "From NGN 250,000", "Short-form content package for social platforms."],
      ["Brand Film", "From NGN 750,000", "Cinematic story for a company, product or campaign."],
      ["Event Production", "Quote after scope", "Coverage priced by event size and deliverables."],
    ],
  },
  animation: {
    title: "AI Animation",
    copy: "AI-assisted animated stories, explainers, product visuals and creative films.",
    options: [
      ["Short AI Animation", "From NGN 300,000", "Short animated scene or visual story."],
      ["Product / Explainer Animation", "From NGN 500,000", "Animation that explains an offer, product or idea."],
      ["Music / Story Visual", "Quote after scope", "Creative animated visual priced by duration and complexity."],
    ],
  },
  design: {
    title: "Motion & Design",
    copy: "Identity systems, motion graphics and campaign visuals.",
    options: [
      ["Brand Identity Starter", "From NGN 300,000", "Logo direction, colors, typography and key brand assets."],
      ["Motion Graphics Pack", "From NGN 250,000", "Animated graphics package for social or video use."],
      ["Campaign Visual System", "From NGN 600,000", "Design language for a launch, offer or campaign."],
    ],
  },
};

const renderBookingOptions = (serviceId) => {
  const serviceMap = cmsData?.services?.length
    ? Object.fromEntries(cmsData.services.map((item) => [item.id, {
        title: item.title,
        copy: item.copy,
        options: item.options.map((option) => [option.name, option.price, option.description]),
      }]))
    : bookingServices;
  const service = serviceMap[serviceId];
  const optionTarget = document.querySelector("[data-booking-options]");
  if (!service || !optionTarget) return;

  document.querySelector("[data-booking-title]")?.replaceChildren(service.title);
  document.querySelector("[data-booking-copy]")?.replaceChildren(service.copy);
  const selectedService = document.querySelector("[data-selected-service]");
  const selectedPackage = document.querySelector("[data-selected-package]");
  if (selectedService) selectedService.value = service.title;

  optionTarget.innerHTML = service.options.map((option, index) => `
    <button class="booking-option ${index === 0 ? "is-selected" : ""}" type="button" data-option-index="${index}">
      <span>${option[1]}</span>
      <strong>${option[0]}</strong>
      <small>${option[2]}</small>
    </button>
  `).join("");

  if (selectedPackage) selectedPackage.value = `${service.options[0][0]} - ${service.options[0][1]}`;
};

document.querySelector("[data-booking-services]")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-service]");
  if (!button) return;
  document.querySelectorAll("[data-service]").forEach((item) => item.classList.toggle("is-active", item === button));
  renderBookingOptions(button.dataset.service);
});

document.querySelector("[data-booking-options]")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option-index]");
  if (!button) return;
  const activeService = document.querySelector("[data-service].is-active")?.dataset.service || "web";
  const option = bookingServices[activeService].options[Number(button.dataset.optionIndex)];
  document.querySelectorAll("[data-option-index]").forEach((item) => item.classList.toggle("is-selected", item === button));
  const selectedPackage = document.querySelector("[data-selected-package]");
  if (selectedPackage) selectedPackage.value = `${option[0]} - ${option[1]}`;
});

renderBookingOptions("web");

const bookingStoreKey = "primeCreativeBookings";
const latestBookingKey = "primeCreativeLatestBooking";
const readBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(bookingStoreKey) || "[]");
  } catch {
    return [];
  }
};
const saveBooking = async (booking) => {
  let record = { id: `PC-${Date.now()}`, createdAt: new Date().toISOString(), status: "New", ...booking };
  if (backendAvailable) {
    try {
      record = await apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(booking) });
    } catch {
      backendAvailable = false;
    }
  }
  localStorage.setItem(latestBookingKey, JSON.stringify(record));
  localStorage.setItem(bookingStoreKey, JSON.stringify([record, ...readBookings()].slice(0, 50)));
  window.location.href = "./booking-confirmation.html";
};

document.querySelector("[data-primary-booking-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  await saveBooking({
    type: "General booking",
    name: data.get("name") || "",
    company: data.get("company") || "",
    email: data.get("email") || "",
    phone: data.get("phone") || "",
    meeting: data.get("meeting") || "",
    timeline: data.get("timeline") || "",
    service: "Not selected yet",
    package: "Discovery consultation",
    notes: data.get("brief") || "",
  });
});

document.querySelector("[data-service-booking-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveBooking({
    type: "Service package booking",
    service: document.querySelector("[data-selected-service]")?.value || "",
    package: document.querySelector("[data-selected-package]")?.value || "",
    notes: new FormData(event.currentTarget).get("notes") || "",
  });
});

const renderBookingConfirmation = () => {
  const target = document.querySelector("[data-booking-confirmation]");
  if (!target) return;
  let booking = null;
  try {
    booking = JSON.parse(localStorage.getItem(latestBookingKey) || "null");
  } catch {
    booking = null;
  }
  if (!booking) {
    target.innerHTML = '<p class="eyebrow">No booking found</p><h2>Start a booking request.</h2><a class="button button-primary" href="./contact.html#book-service">Book Prime Creative <span>-></span></a>';
    return;
  }
  const summary = [
    `Service: ${booking.service || "Not selected"}`,
    `Package: ${booking.package || "Not selected"}`,
    booking.name ? `Name: ${booking.name}` : "",
    booking.email ? `Email: ${booking.email}` : "",
    booking.phone ? `Phone: ${booking.phone}` : "",
    booking.timeline ? `Timeline: ${booking.timeline}` : "",
    booking.notes ? `Notes: ${booking.notes}` : "",
  ].filter(Boolean).join("\n");
  target.innerHTML = `
    <p class="eyebrow">${booking.id}</p>
    <h2>${booking.service || "Booking request"}</h2>
    <div class="booking-summary">
      <p><strong>Package</strong><span>${booking.package || "Discovery consultation"}</span></p>
      <p><strong>Status</strong><span>${booking.status}</span></p>
      <p><strong>Submitted</strong><span>${new Date(booking.createdAt).toLocaleString()}</span></p>
      ${booking.notes ? `<p><strong>Notes</strong><span>${booking.notes}</span></p>` : ""}
    </div>
    <textarea readonly aria-label="Booking summary">${summary}</textarea>
  `;
};

renderBookingConfirmation();

const renderAdminBookings = () => {
  const target = document.querySelector("[data-admin-bookings]");
  const countTarget = document.querySelector("[data-admin-booking-count]");
  if (!target) return;
  const bookings = cmsData?.bookings?.length ? cmsData.bookings : readBookings();
  countTarget?.replaceChildren(String(bookings.length));
  if (!bookings.length) {
    target.innerHTML = '<article class="module-card"><h3>No bookings yet</h3><p>Submit a booking from the contact page and it will appear here in this local preview.</p><a class="button button-primary" href="./contact.html#book-service">Create test booking <span>-></span></a></article>';
    return;
  }
  target.innerHTML = bookings.map((booking) => `
    <article class="admin-booking">
      <div><p class="eyebrow">${booking.id}</p><h3>${booking.service || booking.type}</h3><p>${booking.package || "Discovery consultation"}</p></div>
      <div><strong>${booking.status}</strong><span>${new Date(booking.createdAt).toLocaleString()}</span></div>
      <p>${booking.name || booking.email || booking.phone || booking.notes || "No contact details supplied in package-only booking."}</p>
    </article>
  `).join("");
};

document.querySelector("[data-clear-bookings]")?.addEventListener("click", () => {
  localStorage.removeItem(bookingStoreKey);
  localStorage.removeItem(latestBookingKey);
  renderAdminBookings();
});

renderAdminBookings();

const fillAdminCms = () => {
  if (!document.querySelector("[data-admin-settings-form]")) return;
  const settings = cmsData?.settings || {
    brandName: "Prime Creative",
    whatsapp: "09162902223",
    email: "primecreative66@gmail.com",
    domain: location.origin,
  };
  document.querySelectorAll("[data-admin-settings-form] [name]").forEach((field) => {
    field.value = settings[field.name] || "";
  });
  cmsData = {
    ...(cmsData || {}),
    services: cmsData?.services || Object.entries(bookingServices).map(([id, item]) => ({
      id,
      title: item.title,
      copy: item.copy,
      options: item.options.map(([name, price, description]) => ({ name, price, description })),
    })),
    courses: cmsData?.courses || [],
  };
  renderAdminServices();
  renderAdminCourses();
  renderAdminUploads();
};

const renderAdminServices = () => {
  const target = document.querySelector("[data-admin-service-list]");
  const select = document.querySelector("[data-package-service-select]");
  document.querySelector("[data-admin-service-count]")?.replaceChildren(String(cmsData?.services?.length || 0));
  if (!target) return;
  const services = cmsData?.services || [];
  target.innerHTML = services.map((service) => `
    <article class="admin-manage-card">
      <div><p class="eyebrow">${service.id}</p><h3>${service.title}</h3><p>${service.copy || ""}</p></div>
      <div class="admin-chip-list">${(service.options || []).map((option) => `<span>${option.name} - ${option.price}</span>`).join("") || "<span>No packages yet</span>"}</div>
    </article>
  `).join("");
  if (select) select.innerHTML = services.map((service) => `<option value="${service.id}">${service.title}</option>`).join("");
};

const renderAdminCourses = () => {
  const target = document.querySelector("[data-admin-course-list]");
  const select = document.querySelector("[data-module-course-select]");
  document.querySelector("[data-admin-course-count]")?.replaceChildren(String(cmsData?.courses?.length || 0));
  if (!target) return;
  const courses = cmsData?.courses || [];
  target.innerHTML = courses.map((course) => `
    <article class="admin-manage-card">
      <div><p class="eyebrow">${course.status || "draft"}</p><h3>${course.title}</h3><p>${course.price || "No price set"}</p></div>
      <div class="admin-chip-list">${(course.modules || []).map((module) => `<span>${module.title} - ${module.duration || "No duration"}</span>`).join("") || "<span>No modules yet</span>"}</div>
    </article>
  `).join("");
  if (select) select.innerHTML = courses.map((course) => `<option value="${course.id}">${course.title}</option>`).join("");
};

const renderAdminUploads = () => {
  const target = document.querySelector("[data-admin-uploads]");
  document.querySelector("[data-admin-upload-count]")?.replaceChildren(String(cmsData?.uploads?.length || 0));
  if (!target) return;
  const uploads = cmsData?.uploads || [];
  if (!uploads.length) {
    target.innerHTML = '<article class="module-card"><h3>No uploads yet</h3><p>Upload course files, images, documents or resources here.</p></article>';
    return;
  }
  target.innerHTML = uploads.map((upload) => `
    <article class="admin-booking">
      <div><p class="eyebrow">${upload.id}</p><h3>${upload.name}</h3><p>${upload.type || "Uploaded file"}</p></div>
      <div><strong>Saved</strong><span>${new Date(upload.createdAt).toLocaleString()}</span></div>
      <p><a href="${upload.url}">${upload.url}</a></p>
    </article>
  `).join("");
};

document.querySelector("[data-admin-settings-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (backendAvailable) {
    cmsData.settings = await adminRequest("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
  } else {
    cmsData = { ...(cmsData || {}), settings };
  }
  document.querySelector("[data-cms-status]")?.replaceChildren(backendAvailable ? "Settings saved" : "Saved in preview only");
});

const saveAdminServices = async () => {
  if (backendAvailable) cmsData.services = await adminRequest("/api/services", { method: "PUT", body: JSON.stringify(cmsData.services || []) });
  document.querySelector("[data-cms-status]")?.replaceChildren(backendAvailable ? "Services saved" : "Backend required to persist services");
};

const saveAdminCourses = async () => {
  if (backendAvailable) cmsData.courses = await adminRequest("/api/courses", { method: "PUT", body: JSON.stringify(cmsData.courses || []) });
  document.querySelector("[data-cms-status]")?.replaceChildren(backendAvailable ? "Courses saved" : "Backend required to persist courses");
};

document.querySelector("[data-save-services]")?.addEventListener("click", saveAdminServices);
document.querySelector("[data-save-courses]")?.addEventListener("click", saveAdminCourses);

document.querySelector("[data-admin-service-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (!form.id || !form.title) return;
  cmsData.services = cmsData.services || [];
  const existing = cmsData.services.find((service) => service.id === form.id);
  if (existing) {
    existing.title = form.title;
    existing.copy = form.copy;
  } else {
    cmsData.services.push({ id: form.id, title: form.title, copy: form.copy, options: [] });
  }
  event.currentTarget.reset();
  renderAdminServices();
});

document.querySelector("[data-admin-package-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.currentTarget).entries());
  const service = cmsData.services?.find((item) => item.id === form.serviceId);
  if (!service || !form.name) return;
  service.options = service.options || [];
  service.options.push({ name: form.name, price: form.price, description: form.description });
  event.currentTarget.reset();
  renderAdminServices();
});

document.querySelector("[data-admin-course-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (!form.id || !form.title) return;
  cmsData.courses = cmsData.courses || [];
  const existing = cmsData.courses.find((course) => course.id === form.id);
  if (existing) {
    existing.title = form.title;
    existing.price = form.price;
    existing.status = form.status;
  } else {
    cmsData.courses.push({ id: form.id, title: form.title, price: form.price, status: form.status, modules: [] });
  }
  event.currentTarget.reset();
  renderAdminCourses();
});

document.querySelector("[data-admin-module-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.currentTarget).entries());
  const course = cmsData.courses?.find((item) => item.id === form.courseId);
  if (!course || !form.title) return;
  course.modules = course.modules || [];
  course.modules.push({ title: form.title, duration: form.duration });
  event.currentTarget.reset();
  renderAdminCourses();
});

document.querySelector("[data-admin-upload-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = event.currentTarget.querySelector('input[type="file"]')?.files?.[0];
  if (!file) return;
  const data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  if (backendAvailable) {
    const upload = await adminRequest("/api/uploads", { method: "POST", body: JSON.stringify({ name: file.name, type: file.type, data }) });
    cmsData.uploads = [upload, ...(cmsData.uploads || [])];
    renderAdminUploads();
    document.querySelector("[data-cms-status]")?.replaceChildren("Upload saved");
  } else {
    document.querySelector("[data-cms-status]")?.replaceChildren("Backend required for uploads");
  }
});

const courseCatalog = {
  "ai-animation": {
    title: "AI Animation Bootcamp",
    shortTitle: "AI Animation",
    price: "NGN 50,000",
    paidKey: "primeAcademyPaidAIAnimation",
    description: "Storytelling, visual direction, prompting, generation, editing and delivery for AI-powered animation projects.",
    updated: "Updated Aug 10, 2026",
    downloads: [
      { label: "Bootcamp presentation", href: "./resources/AI_Animation_Bootcamp.pps", protected: true },
      { label: "Offline study guide", href: "./resources/ai-animation-study-guide.html", protected: true },
    ],
    modules: [
      {
        id: "story-direction",
        title: "Story and Creative Direction",
        duration: "42 min",
        summary: "Turn an idea into a focused animation concept with audience, message, style and shot direction.",
        read: "Start with a one-sentence story promise. Define the audience, emotional tone, main character, setting and visual references. A strong AI animation workflow begins before prompting: the clearer the story direction, the easier it is to keep scenes consistent.",
        task: "Write a short animation brief with story promise, target audience, tone, character notes and five planned shots.",
      },
      {
        id: "prompt-systems",
        title: "Prompt Systems and Consistency",
        duration: "55 min",
        summary: "Build reusable prompts for characters, lighting, camera, composition and motion.",
        read: "Treat prompts like production notes. Separate character identity, environment, camera language, lighting, mood and motion. Reuse the same identity details across scenes, then change only the shot-specific action.",
        task: "Create a character prompt, a location prompt and three shot prompts for the same scene.",
      },
      {
        id: "image-video-generation",
        title: "Image and Video Generation",
        duration: "64 min",
        summary: "Generate source frames and video clips while preserving the intended creative direction.",
        read: "Generate key frames first, then animate the strongest frames. Compare outputs against your brief instead of accepting the first attractive result. Keep naming, shot order and version notes organized.",
        task: "Generate three key frames and choose one frame to animate into a short clip.",
      },
      {
        id: "edit-export",
        title: "Edit, Sound and Export",
        duration: "48 min",
        summary: "Assemble clips, refine pacing, add sound and export a finished student project.",
        read: "Editing turns generated clips into a complete story. Focus on pacing, continuity, sound, titles and final export settings. Keep the final project short, polished and easy to review.",
        task: "Edit a 20-40 second final animation and prepare a submission link.",
      },
    ],
  },
  "ai-coding": {
    title: "AI Coding",
    shortTitle: "AI Coding",
    price: "NGN 40,000",
    paidKey: "primeAcademyPaidAICoding",
    description: "Use AI to plan, design, build and publish websites or simple digital products.",
    updated: "Draft course path",
    downloads: [{ label: "Starter checklist", href: "#", protected: false }],
    modules: [
      { id: "product-plan", title: "Product Planning", duration: "35 min", summary: "Turn an idea into features, pages and user flows.", read: "Before writing code, define the user, the problem, the pages and the most important action.", task: "Create a one-page project plan." },
      { id: "interface-build", title: "Interface Build", duration: "58 min", summary: "Use HTML, CSS and AI assistance to build a polished interface.", read: "Build small sections, test often and keep the visual system consistent.", task: "Build a responsive homepage section." },
      { id: "debug-deploy", title: "Debug and Deploy", duration: "45 min", summary: "Fix issues, test responsiveness and publish online.", read: "Debug from the user experience backward: layout, content, interactions and loading.", task: "Deploy a working project preview." },
    ],
  },
  "youtube-ai-automation": {
    title: "YouTube AI Automation",
    shortTitle: "YouTube AI",
    price: "NGN 35,000",
    paidKey: "primeAcademyPaidYouTubeAI",
    description: "Use AI for research, scripting, production planning, editing and repeatable YouTube workflows.",
    updated: "Draft course path",
    downloads: [{ label: "Channel workflow sheet", href: "#", protected: false }],
    modules: [
      { id: "channel-strategy", title: "Channel Strategy", duration: "32 min", summary: "Choose a niche, audience and repeatable content promise.", read: "A channel grows faster when the viewer knows what to expect and why it matters.", task: "Write your channel promise and ten video ideas." },
      { id: "ai-production", title: "AI Production Workflow", duration: "52 min", summary: "Research, script, voice, visuals and edit with AI support.", read: "Use AI to speed up production while keeping a human editorial eye on quality.", task: "Produce a short video script and asset list." },
      { id: "publishing-system", title: "Publishing System", duration: "38 min", summary: "Create repeatable publishing, title and thumbnail workflows.", read: "Consistency comes from a system: topic bank, calendar, packaging checklist and review loop.", task: "Create a 30-day publishing calendar." },
    ],
  },
};

const params = new URLSearchParams(window.location.search);
const selectedCourse = params.get("course") || "ai-animation";
const course = courseCatalog[selectedCourse] || courseCatalog["ai-animation"];
const isLoggedIn = () => localStorage.getItem("primeAcademyLoggedIn") === "true";
const hasPaidAIAnimation = () => localStorage.getItem("primeAcademyPaidAIAnimation") === "true";
const hasPaidCourse = (courseId) => localStorage.getItem(courseCatalog[courseId]?.paidKey) === "true";
const progressKey = (courseId) => `primeAcademyProgress:${courseId}`;
const readProgress = (courseId) => {
  try {
    return JSON.parse(localStorage.getItem(progressKey(courseId)) || "[]");
  } catch {
    return [];
  }
};
const writeProgress = (courseId, moduleIds) => {
  localStorage.setItem(progressKey(courseId), JSON.stringify([...new Set(moduleIds)]));
};
const getCourseProgress = (courseId) => {
  const currentCourse = courseCatalog[courseId];
  if (!currentCourse?.modules?.length) return 0;
  return Math.round((readProgress(courseId).length / currentCourse.modules.length) * 100);
};

document.querySelector("[data-checkout-title]")?.replaceChildren(course.title);
document.querySelector("[data-checkout-price]")?.replaceChildren(course.price);

document.querySelector("[data-login-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  localStorage.setItem("primeAcademyLoggedIn", "true");
  const next = params.get("next") || "checkout.html?course=ai-animation";
  window.location.href = next;
});

document.querySelector("[data-payment-button]")?.addEventListener("click", () => {
  if (!isLoggedIn()) {
    window.location.href = "login.html?next=checkout.html?course=" + encodeURIComponent(selectedCourse);
    return;
  }

  localStorage.setItem(course.paidKey, "true");
  window.location.href = "course-player.html?course=" + encodeURIComponent(selectedCourse);
});

if (document.body.matches("[data-requires-course-access]")) {
  const status = document.querySelector("[data-access-status]");
  if (!isLoggedIn()) {
    status?.replaceChildren("Login required");
    window.setTimeout(() => (window.location.href = "login.html?next=course-player.html?course=" + encodeURIComponent(selectedCourse)), 900);
  } else if (!hasPaidCourse(selectedCourse)) {
    status?.replaceChildren("Payment required");
    window.setTimeout(() => (window.location.href = "checkout.html?course=" + encodeURIComponent(selectedCourse)), 900);
  } else {
    status?.replaceChildren("Unlocked");
    document.body.classList.add("course-unlocked");
  }
}

if (document.body.matches("[data-requires-student-login]")) {
  const status = document.querySelector("[data-portal-status]");
  const portalLoginLink = document.querySelector(".nav-cta[href*='login']");

  if (!isLoggedIn()) {
    status?.replaceChildren("Login required");
    portalLoginLink?.replaceChildren("Login");
    window.setTimeout(() => (window.location.href = "login.html?next=portal.html"), 900);
  } else {
    const hasAnimationAccess = hasPaidAIAnimation();
    status?.replaceChildren(hasAnimationAccess ? "AI Animation unlocked" : "Logged in");
    portalLoginLink?.replaceChildren("Portal active");
    document.body.classList.add("student-logged-in");
    document.body.classList.toggle("student-has-animation", hasAnimationAccess);
  }
}

document.querySelectorAll("[data-protected-download]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const courseId = link.dataset.courseId || "ai-animation";
    if (isLoggedIn() && hasPaidCourse(courseId)) return;
    event.preventDefault();
    window.location.href = isLoggedIn() ? `checkout.html?course=${courseId}` : `login.html?next=checkout.html?course=${courseId}`;
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-protected-download]");
  if (!link || link.dataset.guardAttached === "true") return;
  const courseId = link.dataset.courseId || "ai-animation";
  if (isLoggedIn() && hasPaidCourse(courseId)) return;
  event.preventDefault();
  window.location.href = isLoggedIn() ? `checkout.html?course=${courseId}` : `login.html?next=checkout.html?course=${courseId}`;
});

const renderCoursePlayer = () => {
  const moduleList = document.querySelector("[data-course-modules]");
  const reader = document.querySelector("[data-lesson-reader]");
  if (!moduleList || !reader) return;

  const activeCourse = courseCatalog[selectedCourse] || courseCatalog["ai-animation"];
  document.querySelector("[data-course-title]")?.replaceChildren(activeCourse.title);
  document.querySelector("[data-course-description]")?.replaceChildren(activeCourse.description);
  document.querySelector("[data-module-count]")?.replaceChildren(`${activeCourse.modules.length} modules`);

  const updateProgressUI = () => {
    const progress = getCourseProgress(selectedCourse);
    document.querySelector("[data-course-progress]")?.replaceChildren(`${progress}%`);
    const bar = document.querySelector("[data-course-progress-bar]");
    if (bar) bar.style.width = `${progress}%`;
  };

  const firstDownload = activeCourse.downloads[0];
  document.querySelectorAll("[data-course-download]").forEach((link) => {
    link.href = firstDownload?.href && firstDownload.href !== "#" ? firstDownload.href : "./portal.html#downloads";
    link.dataset.courseId = selectedCourse;
    link.toggleAttribute("data-protected-download", !!firstDownload?.protected);
    link.toggleAttribute("download", !!firstDownload?.protected && firstDownload.href !== "#");
    if (link.classList.contains("nav-cta")) {
      link.replaceChildren(firstDownload?.protected ? "Download" : "Resources");
    } else {
      link.replaceChildren(firstDownload?.protected ? firstDownload.label : "View offline resources");
    }
  });

  const openModule = (module) => {
    const completed = readProgress(selectedCourse).includes(module.id);
    reader.innerHTML = `
      <p class="eyebrow">Online reader</p>
      <h2>${module.title}</h2>
      <div class="lesson-meta"><span>${module.duration}</span><span>${activeCourse.updated}</span></div>
      <p>${module.read}</p>
      <div class="lesson-task"><strong>Practice task</strong><p>${module.task}</p></div>
      <div class="lesson-actions">
        <button class="button button-primary" type="button" data-complete-module="${module.id}">${completed ? "Completed" : "Mark complete"} <span>-></span></button>
        <a class="button button-light" href="./portal.html#downloads">Offline resources</a>
      </div>
    `;
  };

  moduleList.innerHTML = activeCourse.modules.map((module, index) => {
    const complete = readProgress(selectedCourse).includes(module.id);
    return `
      <button class="lesson-link ${complete ? "is-complete" : ""}" type="button" data-open-module="${module.id}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${module.title}</strong>
        <small>${module.duration}</small>
      </button>
    `;
  }).join("");

  moduleList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-module]");
    if (!button) return;
    const nextModule = activeCourse.modules.find((item) => item.id === button.dataset.openModule);
    if (nextModule) openModule(nextModule);
  });

  reader.addEventListener("click", (event) => {
    const button = event.target.closest("[data-complete-module]");
    if (!button) return;
    writeProgress(selectedCourse, [...readProgress(selectedCourse), button.dataset.completeModule]);
    button.replaceChildren("Completed");
    moduleList.querySelector(`[data-open-module="${button.dataset.completeModule}"]`)?.classList.add("is-complete");
    updateProgressUI();
  });

  updateProgressUI();
  openModule(activeCourse.modules[0]);
};

const renderStudentPortal = () => {
  const courseTarget = document.querySelector("[data-portal-courses]");
  const moduleTarget = document.querySelector("[data-portal-modules]");
  const downloadTarget = document.querySelector("[data-portal-downloads]");
  const updateTarget = document.querySelector("[data-portal-updates]");
  if (!courseTarget || !moduleTarget || !downloadTarget || !updateTarget) return;

  const courseEntries = Object.entries(courseCatalog);
  const paidCount = courseEntries.filter(([courseId]) => hasPaidCourse(courseId)).length;
  document.querySelector("[data-portal-summary]")?.replaceChildren(`${paidCount} of ${courseEntries.length} courses unlocked. Module progress is saved automatically in this browser preview.`);

  courseTarget.innerHTML = courseEntries.map(([courseId, item]) => {
    const unlocked = hasPaidCourse(courseId);
    const progress = getCourseProgress(courseId);
    return `
      <article class="portal-course ${unlocked ? "unlocked" : "locked"}">
        <div><span>${unlocked ? "Unlocked" : "Locked"}</span><h3>${item.title}</h3><p>${item.description}</p></div>
        <div class="progress-wrap"><strong>${progress}%</strong><i><b style="width:${progress}%"></b></i></div>
        <a class="button ${unlocked ? "button-primary" : "button-light"}" href="${unlocked ? `./course-player.html?course=${courseId}` : `./checkout.html?course=${courseId}`}">${unlocked ? "Continue" : "Unlock"}</a>
      </article>
    `;
  }).join("");

  moduleTarget.innerHTML = courseEntries.map(([courseId, item]) => `
    <article class="module-group">
      <div><p class="eyebrow">${item.shortTitle}</p><h3>${item.modules.length} modules</h3></div>
      ${item.modules.map((module, index) => `<p><strong>${String(index + 1).padStart(2, "0")}. ${module.title}</strong><span>${module.summary}</span></p>`).join("")}
    </article>
  `).join("");

  downloadTarget.innerHTML = courseEntries.flatMap(([courseId, item]) => item.downloads.map((download) => {
    const locked = download.protected && !hasPaidCourse(courseId);
    return `
      <article class="module-card">
        <h3>${item.shortTitle}: ${download.label}</h3>
        <p>${locked ? "Locked until login and payment are complete." : "Available for offline study."}</p>
        <a class="button button-light" href="${locked ? `./checkout.html?course=${courseId}` : download.href}" ${download.protected ? `data-protected-download data-course-id="${courseId}" download` : ""}>${locked ? "Unlock download" : "Download / Open"}</a>
      </article>
    `;
  })).join("");

  updateTarget.innerHTML = courseEntries.map(([courseId, item]) => `
    <article class="module-card">
      <h3>${item.shortTitle}</h3>
      <p>${item.updated}. New uploads appear here with modules, offline files and progress tracking.</p>
      <a class="button button-light" href="./course-player.html?course=${courseId}">View modules</a>
    </article>
  `).join("");
};

renderCoursePlayer();
renderStudentPortal();

loadCmsData().then(() => {
  renderBookingOptions(document.querySelector("[data-service].is-active")?.dataset.service || "web");
  fillAdminCms();
  renderAdminBookings();
  renderAdminUploads();
});
