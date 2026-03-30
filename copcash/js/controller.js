/**
 * Controller - Manejo de eventos y lógica de aplicación
 */
import { Utils } from "./utils.js";
import { Model } from "./model.js";
import { View } from "./view.js";

export const Controller = {
  init() {
    this.bindGlobalEvents();
    this.applyTheme(Model.data.settings.theme || "light");
    View.showView("dashboard");
  },

  applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  },

  validatePositive(amount, message = "El monto debe ser mayor a cero") {
    if (Utils.toNumber(amount) <= 0) {
      alert(message);
      return false;
    }
    return true;
  },

  bindGlobalEvents() {
    // Navigation
    document.getElementById("navbar").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      View.showView(btn.dataset.view);
    });

    // Theme toggle
    document.getElementById("toggleThemeBtn").addEventListener("click", () => {
      const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
      this.applyTheme(next);
      Model.setTheme(next);
      View.setActiveNav();
    });

    // Export/Import
    document.getElementById("exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(Model.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "organizador-nomina.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("importInput").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          Model.resetWithImport(parsed);
          View.showView(View.currentView);
        } catch {
          alert("El archivo JSON no es valido");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    // Form submissions
    document.body.addEventListener("submit", (e) => {
      if (e.target.id === "fixedForm") return this.handleFixedSubmit(e);
      if (e.target.id === "variableForm") return this.handleVariableSubmit(e);
      if (e.target.id === "extraForm") return this.handleExtraSubmit(e);
      if (e.target.id === "cardForm") return this.handleCardSubmit(e);
      if (e.target.classList.contains("purchaseForm")) return this.handlePurchaseSubmit(e);
      if (e.target.id === "goalForm") return this.handleGoalSubmit(e);
      if (e.target.classList.contains("goalContributionForm")) return this.handleGoalContributionSubmit(e);
      if (e.target.id === "adjustmentForm") return this.handleAdjustmentSubmit(e);
      if (e.target.id === "settingsForm") return this.handleSettingsSubmit(e);
      if (e.target.id === "categoryForm") return this.handleCategorySubmit(e);
    });

    // Generic actions (delete, toggle, etc.)
    document.body.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-action]");
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;
      const cardId = actionEl.dataset.cardId;
      const purchaseId = actionEl.dataset.purchaseId;

      if (action === "delete-fixed") {
        Model.deleteFixedExpense(id);
        return View.renderAll();
      }
      if (action === "delete-variable") {
        Model.deleteVariableExpense(id);
        return View.renderAll();
      }
      if (action === "delete-extra") {
        Model.deleteExtraIncome(id);
        return View.renderAll();
      }
      if (action === "delete-card") {
        Model.deleteCreditCard(id);
        return View.renderAll();
      }
      if (action === "delete-purchase") {
        Model.deletePurchase(cardId, purchaseId);
        return View.renderAll();
      }
      if (action === "pay-installment") {
        Model.payInstallment(cardId, purchaseId);
        return View.renderAll();
      }
      if (action === "delete-goal") {
        Model.deleteSavingsGoal(id);
        return View.renderAll();
      }
      if (action === "delete-flow-event") {
        Model.deleteEventOverride(id);
        return View.renderAll();
      }
      if (action === "edit-flow-event") {
        this.handleEditFlowEvent(id);
        return;
      }
      if (action === "delete-category") {
        this.handleDeleteCategory(id);
        return View.renderAll();
      }
      if (action === "edit-category") {
        this.handleEditCategory(id);
        return View.renderAll();
      }
    });

    // Toggle variable paid
    document.body.addEventListener("change", (e) => {
      if (e.target.matches("input[data-action='toggle-variable-paid']")) {
        const id = e.target.dataset.id;
        Model.toggleVariableExpensePaid(id);
        View.renderAll();
      }
    });
  },

  handleFixedSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const amount = Utils.toNumber(f.get("amount"));
    if (!this.validatePositive(amount)) return;
    Model.addFixedExpense(
      String(f.get("name") || "").trim(),
      amount,
      String(f.get("categoryId") || ""),
      f.get("dueDay")
    );
    e.target.reset();
    View.renderAll();
  },

  handleVariableSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const amount = Utils.toNumber(f.get("amount"));
    const date = String(f.get("date") || "");
    if (!this.validatePositive(amount) || !Utils.isValidDate(date)) return alert("Datos invalidos");
    Model.addVariableExpense(
      String(f.get("name") || "").trim(),
      amount,
      date,
      String(f.get("categoryId") || ""),
      f.get("paid") === "on"
    );
    e.target.reset();
    View.renderAll();
  },

  handleExtraSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const amount = Utils.toNumber(f.get("amount"));
    const date = String(f.get("date") || "");
    if (!this.validatePositive(amount) || !Utils.isValidDate(date)) return alert("Datos invalidos");
    Model.addExtraIncome(
      String(f.get("name") || "").trim(),
      amount,
      date,
      String(f.get("categoryId") || "")
    );
    e.target.reset();
    View.renderAll();
  },

  handleCardSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const limit = Utils.toNumber(f.get("limit"));
    if (!this.validatePositive(limit, "El limite debe ser mayor a cero")) return;
    Model.addCreditCard(
      String(f.get("name") || "").trim(),
      String(f.get("bank") || "").trim(),
      f.get("closingDay"),
      f.get("paymentDay"),
      limit
    );
    e.target.reset();
    View.renderAll();
  },

  handlePurchaseSubmit(e) {
    e.preventDefault();
    const cardId = e.target.dataset.cardId;
    const f = new FormData(e.target);
    const totalAmount = Utils.toNumber(f.get("totalAmount"));
    const totalInstallments = Math.max(1, Math.trunc(Utils.toNumber(f.get("totalInstallments"))));
    const paidInstallments = Math.max(0, Math.trunc(Utils.toNumber(f.get("paidInstallments"))));
    if (!this.validatePositive(totalAmount) || totalInstallments <= 0 || paidInstallments > totalInstallments) {
      return alert("Datos de cuotas invalidos");
    }
    const firstInstallmentDate = String(f.get("firstInstallmentDate") || "");
    if (firstInstallmentDate && !Utils.isValidDate(firstInstallmentDate)) return alert("Fecha invalida");
    Model.addPurchase(
      cardId,
      String(f.get("name") || "").trim(),
      totalAmount,
      totalInstallments,
      paidInstallments,
      firstInstallmentDate
    );
    e.target.reset();
    View.renderAll();
  },

  handleGoalSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const targetAmount = Utils.toNumber(f.get("targetAmount"));
    const currentAmount = Math.max(0, Utils.toNumber(f.get("currentAmount")));
    const monthlyContribution = Math.max(0, Utils.toNumber(f.get("monthlyContribution")));
    const targetDate = String(f.get("targetDate") || "");
    if (!this.validatePositive(targetAmount, "El monto objetivo debe ser mayor a cero")) return;
    if (targetDate && !Utils.isValidDate(targetDate)) return alert("Fecha objetivo invalida");
    Model.addSavingsGoal(
      String(f.get("name") || "").trim(),
      targetAmount,
      currentAmount,
      targetDate,
      monthlyContribution,
      f.get("autoContribution") === "on"
    );
    e.target.reset();
    View.renderAll();
  },

  handleGoalContributionSubmit(e) {
    e.preventDefault();
    const goalId = e.target.dataset.goalId;
    const f = new FormData(e.target);
    const amount = Utils.toNumber(f.get("amount"));
    const date = String(f.get("date") || "");
    if (!this.validatePositive(amount) || !Utils.isValidDate(date)) return alert("Datos invalidos");
    Model.addGoalContribution(goalId, amount, date);
    e.target.reset();
    View.renderAll();
  },

  handleAdjustmentSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const amount = Utils.toNumber(f.get("amount"));
    const date = String(f.get("date") || "");
    const description = String(f.get("description") || "").trim();
    if (!description || !Utils.isValidDate(date) || Number.isNaN(amount)) return alert("Datos invalidos");
    Model.addCashFlowAdjustment(date, description, amount);
    e.target.reset();
    View.renderAll();
  },

  handleSettingsSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const salaryAmount = Utils.toNumber(f.get("salaryAmount"));
    if (!this.validatePositive(salaryAmount, "El salario debe ser mayor a cero")) return;
    Model.updateSettings(salaryAmount, f.get("salaryDay"), f.get("baseBalance"), f.get("flowDays"));
    e.target.reset();
    View.renderAll();
  },

  handleCategorySubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get("name") || "").trim();
    if (!name) return alert("Nombre de categoria requerido");
    Model.addCategory(name, String(f.get("type") || "gasto"), f.get("monthlyBudget"));
    e.target.reset();
    View.renderAll();
  },

  handleEditFlowEvent(eventId) {
    const flow = View.currentView === "cashflow" ? document.getElementById("view-cashflow") : null;
    const event = flow ? null : null; // TODO: access event from calculator
    const date = prompt("Nueva fecha (YYYY-MM-DD)");
    if (!date || !Utils.isValidDate(date)) return alert("Fecha invalida");
    const amountRaw = prompt("Nuevo monto (+/-)");
    const amount = Utils.toNumber(amountRaw);
    if (!amountRaw || Number.isNaN(amount)) return alert("Monto invalido");
    const description = prompt("Nueva descripcion");
    Model.addEventOverride(eventId, date, amount, description || "Evento editado");
    View.renderAll();
  },

  handleDeleteCategory(id) {
    const inUse =
      Model.data.fixedExpenses.some((x) => x.categoryId === id) ||
      Model.data.variableExpenses.some((x) => x.categoryId === id) ||
      Model.data.extraIncomes.some((x) => x.categoryId === id);
    if (inUse) {
      return alert("No puedes eliminar una categoria en uso.");
    }
    Model.deleteCategory(id);
  },

  handleEditCategory(id) {
    const cat = Model.data.categories.find((c) => c.id === id);
    if (!cat) return;
    const name = prompt("Nuevo nombre", cat.name);
    if (!name) return;
    const budget = prompt("Nuevo presupuesto mensual", String(cat.monthlyBudget || 0));
    Model.editCategory(id, name.trim(), budget);
  },
};
