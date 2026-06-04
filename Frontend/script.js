/* ═══════════════════════════════════════════════════════════
   InterNest — Frontend Logic
   Same API endpoints, same data flow — just a polished UI.
   ═══════════════════════════════════════════════════════════ */

// ── DOM references ──────────────────────────────────────
const form         = document.getElementById("form");
const uploadZone   = document.getElementById("uploadZone");
const resumeInput  = document.getElementById("resume");
const fileNameEl   = document.getElementById("fileName");
const submitBtn    = document.getElementById("submitBtn");
const outputEl     = document.getElementById("output");
const emptyState   = document.getElementById("emptyState");
const resultsDesc  = document.getElementById("resultsDesc");

let selectedFile = null;

// ── Navbar scroll effect ────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
});

// ── Upload zone: click, drag & drop ─────────────────────
uploadZone.addEventListener("click", () => resumeInput.click());

resumeInput.addEventListener("change", function () {
    if (this.files.length > 0) handleFile(this.files[0]);
});

uploadZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", function () {
    this.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", function (e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

// ── Handle file selection & auto-parse ──────────────────
function handleFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const validExts = ["pdf", "docx"];

    if (!validExts.includes(ext)) {
        fileNameEl.textContent = "❌ Invalid file type — use PDF or DOCX";
        fileNameEl.style.color = "var(--clr-error)";
        uploadZone.classList.remove("file-selected");
        selectedFile = null;
        return;
    }

    selectedFile = file;
    fileNameEl.textContent = "⏳ Parsing " + file.name + "…";
    fileNameEl.style.color = "var(--clr-primary-lt)";
    uploadZone.classList.add("file-selected");

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:8000/parse-resume", {
        method: "POST",
        body: formData,
    })
        .then((res) => res.json())
        .then((data) => {
            fileNameEl.textContent = "✅ " + file.name;
            fileNameEl.style.color = "var(--clr-success)";

            if (data.skills)   autoFill("skill", data.skills);
            if (data.sector)   autoFill("sector", data.sector);
            if (data.location) autoFill("location", data.location);
        })
        .catch((err) => {
            console.error(err);
            fileNameEl.textContent = "✅ " + file.name + " (auto-fill unavailable)";
            fileNameEl.style.color = "var(--clr-warning)";
        });
}

// ── Auto-fill with highlight animation ──────────────────
function autoFill(id, value) {
    const el = document.getElementById(id);
    el.value = value;
    el.classList.add("auto-filled");
    setTimeout(() => el.classList.remove("auto-filled"), 2000);
}

// ── Form submission ─────────────────────────────────────
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const skill    = document.getElementById("skill").value.trim();
    const sector   = document.getElementById("sector").value.trim();
    const location = document.getElementById("location").value.trim();

    if (!skill || !sector || !location) {
        showStatus("We need all three fields filled in — Skills, Sector, and Location.", true);
        return;
    }

    // Show loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
        const response = await fetch("http://127.0.0.1:8000/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills: skill, sector: sector, location: location }),
        });

        const data = await response.json();

        outputEl.innerHTML = "";

        if (!data || data.length === 0) {
            showStatus("Hmm, nothing matched that combination. Try tweaking your search a bit.");
            return;
        }

        resultsDesc.textContent = `Here are ${data.length} internship${data.length > 1 ? "s" : ""} that look like a good fit.`;

        data.forEach((intern, i) => {
            const card = document.createElement("div");
            card.className = "card";

            // Use raw stipend text when available, else format from min/max
            const stipendDisplay = intern.Stipend
                ? escapeHtml(intern.Stipend).replace(/\?\s*/g, '₹')
                : `₹${formatNum(intern["Min Stipend"])} – ₹${formatNum(intern["Max Stipend"])}`;

            const startDate = intern["Start Date"] || "—";
            const duration  = intern["Duration (months)"] != null
                ? `${intern["Duration (months)"]} Months`
                : "—";

            card.innerHTML = `
                <div class="card__rank">#${i + 1}</div>
                <h3 class="card__company">${escapeHtml(intern.Company || "Unknown Company")}</h3>
                <div class="card__details">
                    <div class="card__detail">
                        <div class="card__detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                        </div>
                        <div class="card__detail-content">
                            <span class="card__detail-label">Sector</span>
                            <span class="card__detail-value">${escapeHtml(intern.Sector || "—")}</span>
                        </div>
                    </div>
                    <div class="card__detail">
                        <div class="card__detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div class="card__detail-content">
                            <span class="card__detail-label">Location</span>
                            <span class="card__detail-value">${escapeHtml(intern.Location || "—")}</span>
                        </div>
                    </div>
                    <div class="card__detail">
                        <div class="card__detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        </div>
                        <div class="card__detail-content">
                            <span class="card__detail-label">Stipend</span>
                            <span class="card__detail-value">${stipendDisplay}</span>
                        </div>
                    </div>
                    <div class="card__detail">
                        <div class="card__detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div class="card__detail-content">
                            <span class="card__detail-label">Duration</span>
                            <span class="card__detail-value">${duration}</span>
                        </div>
                    </div>
                    <div class="card__detail">
                        <div class="card__detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </div>
                        <div class="card__detail-content">
                            <span class="card__detail-label">Start Date</span>
                            <span class="card__detail-value">${escapeHtml(startDate)}</span>
                        </div>
                    </div>
                </div>
            `;
            outputEl.appendChild(card);
        });

        // Smooth scroll to results
        document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        console.error(error);
        showStatus("Can't reach the server right now. Make sure the backend is running and try again.", true);
    } finally {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
    }
});

// ── Helpers ─────────────────────────────────────────────
function showStatus(msg, isError = false) {
    outputEl.innerHTML = `<div class="status-msg ${isError ? "error" : ""}">${escapeHtml(msg)}</div>`;
    resultsDesc.textContent = isError
        ? "Something didn't go as planned."
        : "Your matches will show up right here once you search.";
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function formatNum(n) {
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString("en-IN");
}