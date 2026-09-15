const header = document.querySelector("[data-header]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 18);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const reveals = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -45px" });
  reveals.forEach((element) => observer.observe(element));
}

if (!reducedMotion) {
  window.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty("--orb-x", `${(x * 16).toFixed(2)}px`);
    document.documentElement.style.setProperty("--orb-y", `${(y * 16).toFixed(2)}px`);
    document.documentElement.style.setProperty("--orb-x-reverse", `${(-x * 11).toFixed(2)}px`);
    document.documentElement.style.setProperty("--orb-y-reverse", `${(-y * 11).toFixed(2)}px`);
  }, { passive: true });
}

const tabs = [...document.querySelectorAll("[data-tab]")];
const panels = [...document.querySelectorAll("[data-panel]")];
function activateTab(name) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.hidden = !active;
    if (!active) panel.querySelectorAll("video").forEach((video) => video.pause());
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    activateTab(tabs[next].dataset.tab);
    tabs[next].focus();
  });
});

document.querySelectorAll("[data-sync-group]").forEach((group) => {
  const videos = [...group.querySelectorAll("video")];
  let syncing = false;
  const runTogether = (source, action) => {
    if (syncing) return;
    syncing = true;
    const peers = videos.filter((video) => video !== source);
    if (action === "play") peers.forEach((video) => {
      if (Math.abs(video.currentTime - source.currentTime) > 0.25) video.currentTime = source.currentTime;
      video.play().catch(() => {});
    });
    if (action === "pause") peers.forEach((video) => video.pause());
    if (action === "seek") peers.forEach((video) => { video.currentTime = source.currentTime; });
    requestAnimationFrame(() => { syncing = false; });
  };
  videos.forEach((video) => {
    video.addEventListener("play", () => runTogether(video, "play"));
    video.addEventListener("pause", () => runTogether(video, "pause"));
    video.addEventListener("seeked", () => runTogether(video, "seek"));
    video.addEventListener("timeupdate", () => {
      if (syncing || video.paused) return;
      videos.forEach((peer) => {
        if (peer !== video && Math.abs(peer.currentTime - video.currentTime) > 0.4) peer.currentTime = video.currentTime;
      });
    });
  });
});

const dialog = document.querySelector("[data-lightbox-dialog]");
const dialogImage = dialog?.querySelector("img");
document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!dialog || !dialogImage) return;
    dialogImage.src = button.dataset.lightbox;
    dialogImage.alt = button.querySelector("img")?.alt || "Expanded research figure";
    dialog.showModal();
  });
});
document.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

const simVideo = document.querySelector("[data-sim-rollout]");
const simTitle = document.querySelector("[data-sim-title]");
const simTasks = [...document.querySelectorAll("[data-sim-task]")];
simTasks.forEach((task) => {
  task.addEventListener("click", () => {
    if (!simVideo) return;
    const alreadySelected = task.getAttribute("aria-pressed") === "true";
    simTasks.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === task)));
    if (simTitle) simTitle.textContent = task.dataset.simLabel || task.textContent.trim();
    if (!alreadySelected) {
      simVideo.pause();
      simVideo.poster = task.dataset.simPoster || "";
      simVideo.src = task.dataset.simSrc;
      simVideo.load();
    }
    simVideo.play().catch(() => {});
  });
});

const copyButton = document.querySelector("[data-copy-citation]");
copyButton?.addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex")?.innerText || "";
  try {
    await navigator.clipboard.writeText(citation);
    copyButton.textContent = "Copied";
    window.setTimeout(() => { copyButton.textContent = "Copy citation"; }, 1800);
  } catch {
    copyButton.textContent = "Select text to copy";
  }
});

document.querySelectorAll("video").forEach((video) => {
  video.addEventListener("ended", () => video.load());
  video.addEventListener("loadedmetadata", () => {
    if (video.duration && video.currentTime >= video.duration - 0.25) {
      video.currentTime = 0;
      video.pause();
    }
  }, { once: true });
});
