export function openHelpModal(helpModal, helpModalCloseBtn) {
    if (!helpModal)
        return;
    helpModal.classList.remove("hidden");
    helpModalCloseBtn?.focus();
}
export function closeHelpModal(helpModal) {
    if (!helpModal)
        return;
    helpModal.classList.add("hidden");
}
export function isHelpModalOpen(helpModal) {
    return !!helpModal && !helpModal.classList.contains("hidden");
}
