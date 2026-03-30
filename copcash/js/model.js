/**
 * Model - Gestión de datos y lógica de negocio
 */
import { Utils } from "./utils.js";

const STORAGE_KEY = "advancedPayrollOrganizerData_v1";

const sampleData = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const mkDate = (day, monthOffset = 0) => Utils.dateISO(new Date(y, m + monthOffset, day));

  const catVivienda = { id: Utils.uid("cat"), name: "Vivienda", type: "gasto", monthlyBudget: 900 };
  const catServicios = { id: Utils.uid("cat"), name: "Servicios", type: "gasto", monthlyBudget: 250 };
  const catComida = { id: Utils.uid("cat"), name: "Comida", type: "gasto", monthlyBudget: 350 };
  const catTransporte = { id: Utils.uid("cat"), name: "Transporte", type: "gasto", monthlyBudget: 120 };
  const catFreelance = { id: Utils.uid("cat"), name: "Freelance", type: "ingreso", monthlyBudget: 0 };
  const catAhorro = { id: Utils.uid("cat"), name: "Ahorro", type: "ahorro", monthlyBudget: 400 };

  const cardId = Utils.uid("card");
  const purchaseA = {
    id: Utils.uid("pur"),
    name: "Laptop trabajo",
    totalAmount: 1200,
    totalInstallments: 6,
    paidInstallments: 2,
    firstInstallmentDate: mkDate(15, -1),
  };
  const purchaseB = {
    id: Utils.uid("pur"),
    name: "Silla ergonomica",
    totalAmount: 360,
    totalInstallments: 3,
    paidInstallments: 1,
    firstInstallmentDate: mkDate(20, -1),
  };

  const goalId = Utils.uid("goal");

  return {
    settings: {
      salaryAmount: 2800,
      salaryDay: 5,
      baseBalance: 0,
      theme: "light",
      flowDays: 60,
    },
    categories: [catVivienda, catServicios, catComida, catTransporte, catFreelance, catAhorro],
    fixedExpenses: [
      { id: Utils.uid("fix"), name: "Alquiler", amount: 850, categoryId: catVivienda.id, dueDay: 10 },
      { id: Utils.uid("fix"), name: "Internet", amount: 65, categoryId: catServicios.id, dueDay: 12 },
    ],
    variableExpenses: [
      {
        id: Utils.uid("var"),
        name: "Supermercado",
        amount: 140,
        date: mkDate(8),
        categoryId: catComida.id,
        paid: true,
      },
      {
        id: Utils.uid("var"),
        name: "Taxi",
        amount: 26,
        date: mkDate(11),
        categoryId: catTransporte.id,
        paid: false,
      },
    ],
    extraIncomes: [
      {
        id: Utils.uid("inc"),
        name: "Proyecto landing",
        amount: 320,
        date: mkDate(18),
        categoryId: catFreelance.id,
      },
    ],
    creditCards: [
      {
        id: cardId,
        name: "Visa Oro",
        bank: "Banco Central",
        closingDay: 25,
        paymentDay: 4,
        limit: 3000,
        purchases: [purchaseA, purchaseB],
      },
    ],
    savingsGoals: [
      {
        id: goalId,
        name: "Viaje a la playa",
        targetAmount: 1000,
        currentAmount: 180,
        targetDate: mkDate(20, 6),
        monthlyContribution: 120,
        autoContribution: true,
      },
    ],
    goalContributions: [],
    cashFlowAdjustments: [
      { id: Utils.uid("adj"), date: mkDate(14), description: "Mantenimiento moto", amount: -45, type: "manual" },
    ],
    eventOverrides: [],
  };
};

export const Model = {
  data: null,

  init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      this.data = sampleData();
      this.save();
    } else {
      try {
        this.data = JSON.parse(stored);
      } catch {
        this.data = sampleData();
        this.save();
      }
    }
    this.ensureStructure();
  },

  ensureStructure() {
    const defaults = sampleData();
    if (!this.data || typeof this.data !== "object" || Array.isArray(this.data)) {
      this.data = defaults;
      return;
    }

    for (const key of Object.keys(defaults)) {
      if (typeof this.data[key] === "undefined") {
        this.data[key] = defaults[key];
      }
    }

    // Normaliza tipos para evitar fallos de render por datos legacy/corruptos.
    if (!this.data.settings || typeof this.data.settings !== "object" || Array.isArray(this.data.settings)) {
      this.data.settings = { ...defaults.settings };
    }
    const arrayKeys = [
      "categories",
      "fixedExpenses",
      "variableExpenses",
      "extraIncomes",
      "creditCards",
      "savingsGoals",
      "goalContributions",
      "cashFlowAdjustments",
      "eventOverrides",
    ];
    arrayKeys.forEach((key) => {
      if (!Array.isArray(this.data[key])) {
        this.data[key] = defaults[key];
      }
    });

    this.data.creditCards = this.data.creditCards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({
        id: card.id || Utils.uid("card"),
        name: card.name || "Tarjeta",
        bank: card.bank || "Banco",
        closingDay: Utils.clampDay(card.closingDay || 25),
        paymentDay: Utils.clampDay(card.paymentDay || 5),
        limit: Math.max(0, Utils.toNumber(card.limit)),
        purchases: Array.isArray(card.purchases) ? card.purchases : [],
      }));

    this.data.savingsGoals = this.data.savingsGoals
      .filter((goal) => goal && typeof goal === "object")
      .map((goal) => ({
        id: goal.id || Utils.uid("goal"),
        name: goal.name || "Meta",
        targetAmount: Math.max(1, Utils.toNumber(goal.targetAmount)),
        currentAmount: Math.max(0, Utils.toNumber(goal.currentAmount)),
        targetDate: goal.targetDate || "",
        monthlyContribution: Math.max(0, Utils.toNumber(goal.monthlyContribution)),
        autoContribution: Boolean(goal.autoContribution),
      }));

    if (this.data.categories.length === 0) {
      this.data.categories = defaults.categories;
    }

    this.data.settings.salaryDay = Utils.clampDay(this.data.settings.salaryDay || 5);
    this.data.settings.salaryAmount = Math.max(0, Utils.toNumber(this.data.settings.salaryAmount || defaults.settings.salaryAmount));
    this.data.settings.baseBalance = Utils.toNumber(this.data.settings.baseBalance || 0);
    this.data.settings.theme = this.data.settings.theme === "dark" ? "dark" : "light";
    this.data.settings.flowDays = Math.max(30, Math.min(60, Utils.toNumber(this.data.settings.flowDays || 60)));
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  resetWithImport(parsed) {
    this.data = parsed;
    this.ensureStructure();
    this.save();
  },

  getCategoryName(id) {
    const cat = this.data.categories.find((c) => c.id === id);
    return cat ? cat.name : "Sin categoria";
  },

  // CRUD - Fixed Expenses
  addFixedExpense(name, amount, categoryId, dueDay) {
    this.data.fixedExpenses.push({
      id: Utils.uid("fix"),
      name,
      amount: Utils.toNumber(amount),
      categoryId,
      dueDay: Utils.clampDay(dueDay),
    });
    this.save();
  },

  deleteFixedExpense(id) {
    this.data.fixedExpenses = this.data.fixedExpenses.filter((x) => x.id !== id);
    this.save();
  },

  // CRUD - Variable Expenses
  addVariableExpense(name, amount, date, categoryId, paid = false) {
    this.data.variableExpenses.push({
      id: Utils.uid("var"),
      name,
      amount: Utils.toNumber(amount),
      date,
      categoryId,
      paid,
    });
    this.save();
  },

  deleteVariableExpense(id) {
    this.data.variableExpenses = this.data.variableExpenses.filter((x) => x.id !== id);
    this.save();
  },

  toggleVariableExpensePaid(id) {
    const item = this.data.variableExpenses.find((x) => x.id === id);
    if (item) {
      item.paid = !item.paid;
      this.save();
    }
  },

  // CRUD - Extra Incomes
  addExtraIncome(name, amount, date, categoryId) {
    this.data.extraIncomes.push({
      id: Utils.uid("inc"),
      name,
      amount: Utils.toNumber(amount),
      date,
      categoryId,
    });
    this.save();
  },

  deleteExtraIncome(id) {
    this.data.extraIncomes = this.data.extraIncomes.filter((x) => x.id !== id);
    this.save();
  },

  // CRUD - Credit Cards
  addCreditCard(name, bank, closingDay, paymentDay, limit) {
    this.data.creditCards.push({
      id: Utils.uid("card"),
      name,
      bank,
      closingDay: Utils.clampDay(closingDay),
      paymentDay: Utils.clampDay(paymentDay),
      limit: Utils.toNumber(limit),
      purchases: [],
    });
    this.save();
  },

  deleteCreditCard(id) {
    this.data.creditCards = this.data.creditCards.filter((x) => x.id !== id);
    this.save();
  },

  // CRUD - Purchases (Cuotas)
  addPurchase(cardId, name, totalAmount, totalInstallments, paidInstallments, firstInstallmentDate) {
    const card = this.data.creditCards.find((c) => c.id === cardId);
    if (!card) return;
    card.purchases.push({
      id: Utils.uid("pur"),
      name,
      totalAmount: Utils.toNumber(totalAmount),
      totalInstallments: Math.max(1, Math.trunc(Utils.toNumber(totalInstallments))),
      paidInstallments: Math.max(0, Math.trunc(Utils.toNumber(paidInstallments))),
      firstInstallmentDate,
    });
    this.save();
  },

  deletePurchase(cardId, purchaseId) {
    const card = this.data.creditCards.find((c) => c.id === cardId);
    if (!card) return;
    card.purchases = card.purchases.filter((p) => p.id !== purchaseId);
    this.save();
  },

  payInstallment(cardId, purchaseId) {
    const card = this.data.creditCards.find((c) => c.id === cardId);
    if (!card) return;
    const purchase = card.purchases.find((p) => p.id === purchaseId);
    if (!purchase) return;
    purchase.paidInstallments = Math.min(
      Utils.toNumber(purchase.totalInstallments),
      Utils.toNumber(purchase.paidInstallments) + 1
    );
    this.save();
  },

  // CRUD - Savings Goals
  addSavingsGoal(name, targetAmount, currentAmount, targetDate, monthlyContribution, autoContribution) {
    this.data.savingsGoals.push({
      id: Utils.uid("goal"),
      name,
      targetAmount: Utils.toNumber(targetAmount),
      currentAmount: Math.max(0, Utils.toNumber(currentAmount)),
      targetDate,
      monthlyContribution: Math.max(0, Utils.toNumber(monthlyContribution)),
      autoContribution,
    });
    this.save();
  },

  deleteSavingsGoal(id) {
    this.data.savingsGoals = this.data.savingsGoals.filter((g) => g.id !== id);
    this.data.goalContributions = this.data.goalContributions.filter((g) => g.goalId !== id);
    this.save();
  },

  addGoalContribution(goalId, amount, date) {
    const goal = this.data.savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;
    goal.currentAmount = Number((Utils.toNumber(goal.currentAmount) + Utils.toNumber(amount)).toFixed(2));
    this.data.goalContributions.push({
      id: Utils.uid("gc"),
      goalId,
      amount: Utils.toNumber(amount),
      date,
      type: "manual",
    });
    this.save();
  },

  // CRUD - Categories
  addCategory(name, type, monthlyBudget) {
    this.data.categories.push({
      id: Utils.uid("cat"),
      name,
      type,
      monthlyBudget: Math.max(0, Utils.toNumber(monthlyBudget)),
    });
    this.save();
  },

  deleteCategory(id) {
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.save();
  },

  editCategory(id, name, monthlyBudget) {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) return;
    cat.name = name;
    cat.monthlyBudget = Math.max(0, Utils.toNumber(monthlyBudget));
    this.save();
  },

  // CRUD - Settings
  updateSettings(salaryAmount, salaryDay, baseBalance, flowDays) {
    this.data.settings.salaryAmount = Utils.toNumber(salaryAmount);
    this.data.settings.salaryDay = Utils.clampDay(salaryDay);
    this.data.settings.baseBalance = Utils.toNumber(baseBalance);
    this.data.settings.flowDays = Math.max(30, Math.min(60, Utils.toNumber(flowDays)));
    this.save();
  },

  setTheme(theme) {
    this.data.settings.theme = theme;
    this.save();
  },

  // CRUD - Cash Flow Adjustments
  addCashFlowAdjustment(date, description, amount) {
    this.data.cashFlowAdjustments.push({
      id: Utils.uid("adj"),
      date,
      description,
      amount: Utils.toNumber(amount),
      type: "manual",
    });
    this.save();
  },

  deleteCashFlowAdjustment(id) {
    this.data.cashFlowAdjustments = this.data.cashFlowAdjustments.filter((x) => x.id !== id);
    this.save();
  },

  // CRUD - Event Overrides
  addEventOverride(eventId, date, amount, description) {
    const idx = this.data.eventOverrides.findIndex((x) => x.eventId === eventId);
    const payload = { eventId, date, amount: Utils.toNumber(amount), description, deleted: false };
    if (idx >= 0) {
      this.data.eventOverrides[idx] = payload;
    } else {
      this.data.eventOverrides.push(payload);
    }
    this.save();
  },

  deleteEventOverride(eventId) {
    const idx = this.data.eventOverrides.findIndex((x) => x.eventId === eventId);
    if (idx >= 0) {
      this.data.eventOverrides[idx].deleted = true;
    } else {
      this.data.eventOverrides.push({ eventId, deleted: true });
    }
    this.save();
  },
};
