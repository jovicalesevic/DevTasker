import { renderDiffPreviewHtml } from "./diffPreview.js";
export function createDiffModalController(deps) {
    let activeResolver = null;
    let activePreview = null;
    let lastViewMode = loadViewMode(deps.storageKey);
    function updateView() {
        if (!activePreview || !deps.diffModalBody)
            return;
        const preview = activePreview.mode === "detailed" ? activePreview.detailed : activePreview.compact;
        deps.diffModalBody.innerHTML = renderDiffPreviewHtml(preview, deps.escapeHtml);
        if (deps.diffModalViewToggleBtn) {
            deps.diffModalViewToggleBtn.textContent = activePreview.mode === "detailed" ? deps.t("diff.viewDetailed") : deps.t("diff.viewCompact");
            deps.diffModalViewToggleBtn.classList.toggle("is-active", activePreview.mode === "detailed");
        }
    }
    return {
        show(title, description, preview) {
            if (!deps.diffModal || !deps.diffModalDescription || !deps.diffModalBody || !deps.diffModalCancelBtn) {
                return Promise.resolve(window.confirm(`${title}\n\n${description}\n\n${preview.detailed}`));
            }
            const titleEl = document.getElementById("diffModalTitle");
            if (titleEl)
                titleEl.textContent = title;
            deps.diffModalDescription.textContent = description;
            activePreview = { ...preview, mode: lastViewMode };
            updateView();
            deps.diffModal.classList.remove("hidden");
            deps.diffModalCancelBtn.focus();
            if (activeResolver) {
                activeResolver(false);
                activeResolver = null;
            }
            return new Promise((resolve) => {
                activeResolver = resolve;
            });
        },
        close(approved) {
            if (!deps.diffModal || deps.diffModal.classList.contains("hidden"))
                return;
            deps.diffModal.classList.add("hidden");
            if (deps.diffModalBody)
                deps.diffModalBody.textContent = "";
            activePreview = null;
            const resolver = activeResolver;
            activeResolver = null;
            if (resolver)
                resolver(approved);
        },
        toggleView() {
            if (!activePreview)
                return;
            activePreview.mode = activePreview.mode === "detailed" ? "compact" : "detailed";
            lastViewMode = activePreview.mode;
            saveViewMode(deps.storageKey, lastViewMode);
            updateView();
        },
        isOpen() {
            return !!deps.diffModal && !deps.diffModal.classList.contains("hidden");
        },
        resetViewPreference() {
            localStorage.removeItem(deps.storageKey);
            lastViewMode = "detailed";
        }
    };
}
function loadViewMode(storageKey) {
    const saved = localStorage.getItem(storageKey);
    return saved === "compact" ? "compact" : "detailed";
}
function saveViewMode(storageKey, mode) {
    localStorage.setItem(storageKey, mode);
}
