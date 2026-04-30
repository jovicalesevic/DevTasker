export function openHelpModal(
  helpModal: HTMLDivElement | null,
  helpModalCloseBtn: HTMLButtonElement | null
): void {
  if (!helpModal) return;
  helpModal.classList.remove("hidden");
  helpModalCloseBtn?.focus();
}

export function closeHelpModal(helpModal: HTMLDivElement | null): void {
  if (!helpModal) return;
  helpModal.classList.add("hidden");
}

export function isHelpModalOpen(helpModal: HTMLDivElement | null): boolean {
  return !!helpModal && !helpModal.classList.contains("hidden");
}
