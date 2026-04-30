import { renderDiffPreviewHtml } from "./diffPreview.js";

type PreviewPayload = { compact: string; detailed: string };
type ViewMode = "compact" | "detailed";

interface DiffModalControllerDeps {
  storageKey: string;
  diffModal: HTMLDivElement | null;
  diffModalDescription: HTMLParagraphElement | null;
  diffModalBody: HTMLPreElement | null;
  diffModalViewToggleBtn: HTMLButtonElement | null;
  diffModalCancelBtn: HTMLButtonElement | null;
  escapeHtml: (value: string) => string;
  t: (key: string) => string;
}

export interface DiffModalController {
  show: (title: string, description: string, preview: PreviewPayload) => Promise<boolean>;
  close: (approved: boolean) => void;
  toggleView: () => void;
  isOpen: () => boolean;
  resetViewPreference: () => void;
}

export function createDiffModalController(deps: DiffModalControllerDeps): DiffModalController {
  let activeResolver: ((approved: boolean) => void) | null = null;
  let activePreview: { compact: string; detailed: string; mode: ViewMode } | null = null;
  let lastViewMode: ViewMode = loadViewMode(deps.storageKey);

  function updateView(): void {
    if (!activePreview || !deps.diffModalBody) return;
    const preview = activePreview.mode === "detailed" ? activePreview.detailed : activePreview.compact;
    deps.diffModalBody.innerHTML = renderDiffPreviewHtml(preview, deps.escapeHtml);
    if (deps.diffModalViewToggleBtn) {
      deps.diffModalViewToggleBtn.textContent = activePreview.mode === "detailed" ? deps.t("diff.viewDetailed") : deps.t("diff.viewCompact");
      deps.diffModalViewToggleBtn.classList.toggle("is-active", activePreview.mode === "detailed");
    }
  }

  return {
    show(title: string, description: string, preview: PreviewPayload): Promise<boolean> {
      if (!deps.diffModal || !deps.diffModalDescription || !deps.diffModalBody || !deps.diffModalCancelBtn) {
        return Promise.resolve(window.confirm(`${title}\n\n${description}\n\n${preview.detailed}`));
      }

      const titleEl = document.getElementById("diffModalTitle");
      if (titleEl) titleEl.textContent = title;
      deps.diffModalDescription.textContent = description;
      activePreview = { ...preview, mode: lastViewMode };
      updateView();
      deps.diffModal.classList.remove("hidden");
      deps.diffModalCancelBtn.focus();

      if (activeResolver) {
        activeResolver(false);
        activeResolver = null;
      }
      return new Promise<boolean>((resolve) => {
        activeResolver = resolve;
      });
    },
    close(approved: boolean): void {
      if (!deps.diffModal || deps.diffModal.classList.contains("hidden")) return;
      deps.diffModal.classList.add("hidden");
      if (deps.diffModalBody) deps.diffModalBody.textContent = "";
      activePreview = null;
      const resolver = activeResolver;
      activeResolver = null;
      if (resolver) resolver(approved);
    },
    toggleView(): void {
      if (!activePreview) return;
      activePreview.mode = activePreview.mode === "detailed" ? "compact" : "detailed";
      lastViewMode = activePreview.mode;
      saveViewMode(deps.storageKey, lastViewMode);
      updateView();
    },
    isOpen(): boolean {
      return !!deps.diffModal && !deps.diffModal.classList.contains("hidden");
    },
    resetViewPreference(): void {
      localStorage.removeItem(deps.storageKey);
      lastViewMode = "detailed";
    }
  };
}

function loadViewMode(storageKey: string): ViewMode {
  const saved = localStorage.getItem(storageKey);
  return saved === "compact" ? "compact" : "detailed";
}

function saveViewMode(storageKey: string, mode: ViewMode): void {
  localStorage.setItem(storageKey, mode);
}
