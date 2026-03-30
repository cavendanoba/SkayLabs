/**
 * Utils - Funciones reutilizables y helpers
 */

export const Utils = {
  uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
  },

  toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  },

  money(value) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value || 0);
  },

  dateISO(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  },

  clampDay(day) {
    const d = Number(day);
    if (!Number.isFinite(d)) return 1;
    return Math.max(1, Math.min(28, Math.trunc(d)));
  },

  monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  },

  isValidDate(value) {
    if (!value) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  },

  escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },
};
