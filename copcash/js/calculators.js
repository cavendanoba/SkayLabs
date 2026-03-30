/**
 * Calculators - Cálculos financieros complejos
 */
import { Utils } from "./utils.js";
import { Model } from "./model.js";

export const Calculators = {
  installmentValue(purchase) {
    const total = Utils.toNumber(purchase.totalAmount);
    const installments = Math.max(1, Utils.toNumber(purchase.totalInstallments));
    return Number((total / installments).toFixed(2));
  },

  remainingInstallments(purchase) {
    return Math.max(0, Utils.toNumber(purchase.totalInstallments) - Utils.toNumber(purchase.paidInstallments));
  },

  remainingAmount(purchase) {
    return Number((this.remainingInstallments(purchase) * this.installmentValue(purchase)).toFixed(2));
  },

  cardBalance(card) {
    return Number((card.purchases.reduce((acc, p) => acc + this.remainingAmount(p), 0)).toFixed(2));
  },

  cardMonthlyPayment(card) {
    return Number(
      (card.purchases
        .filter((p) => this.remainingInstallments(p) > 0)
        .reduce((acc, p) => acc + this.installmentValue(p), 0))
        .toFixed(2)
    );
  },

  allCardsMonthlyPayment() {
    return Number((Model.data.creditCards.reduce((acc, card) => acc + this.cardMonthlyPayment(card), 0)).toFixed(2));
  },

  fixedMonthlyTotal() {
    return Number((Model.data.fixedExpenses.reduce((acc, x) => acc + Utils.toNumber(x.amount), 0)).toFixed(2));
  },

  paidVariableCurrentMonth() {
    const nowMonth = Utils.monthKey(new Date());
    return Number(
      (Model.data.variableExpenses
        .filter((x) => x.paid && Utils.monthKey(x.date) === nowMonth)
        .reduce((acc, x) => acc + Utils.toNumber(x.amount), 0))
        .toFixed(2)
    );
  },

  extraIncomeCurrentMonth() {
    const nowMonth = Utils.monthKey(new Date());
    return Number(
      (Model.data.extraIncomes
        .filter((x) => Utils.monthKey(x.date) === nowMonth)
        .reduce((acc, x) => acc + Utils.toNumber(x.amount), 0))
        .toFixed(2)
    );
  },

  goalsContributionCurrentMonth() {
    const nowMonth = Utils.monthKey(new Date());
    const manual = Model.data.goalContributions
      .filter((c) => Utils.monthKey(c.date) === nowMonth)
      .reduce((acc, c) => acc + Utils.toNumber(c.amount), 0);
    const auto = Model.data.savingsGoals
      .filter((g) => g.autoContribution)
      .reduce((acc, g) => acc + Utils.toNumber(g.monthlyContribution), 0);
    return Number((manual + auto).toFixed(2));
  },

  freeMoney() {
    const salary = Utils.toNumber(Model.data.settings.salaryAmount);
    const extra = this.extraIncomeCurrentMonth();
    const fixed = this.fixedMonthlyTotal();
    return Number((salary + extra - fixed).toFixed(2));
  },

  realFreeMoney() {
    const base = this.freeMoney();
    const variables = this.paidVariableCurrentMonth();
    const cards = this.allCardsMonthlyPayment();
    const goals = this.goalsContributionCurrentMonth();
    return Number((base - variables - cards - goals).toFixed(2));
  },

  categorySpentCurrentMonth(categoryId) {
    const nowMonth = Utils.monthKey(new Date());
    const fixed = Model.data.fixedExpenses
      .filter((x) => x.categoryId === categoryId)
      .reduce((acc, x) => acc + Utils.toNumber(x.amount), 0);
    const variable = Model.data.variableExpenses
      .filter((x) => x.categoryId === categoryId && x.paid && Utils.monthKey(x.date) === nowMonth)
      .reduce((acc, x) => acc + Utils.toNumber(x.amount), 0);
    return Number((fixed + variable).toFixed(2));
  },

  goalRequiredMonthly(goal) {
    if (!goal.targetDate) return null;
    const target = new Date(goal.targetDate);
    const now = new Date();
    if (Number.isNaN(target.getTime())) return null;
    const months = Math.max(
      1,
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()) + 1
    );
    const remain = Math.max(0, Utils.toNumber(goal.targetAmount) - Utils.toNumber(goal.currentAmount));
    return Number((remain / months).toFixed(2));
  },

  generateCardInstallmentEvents(startDate, endDate) {
    const events = [];
    for (const card of Model.data.creditCards) {
      const monthMap = {};
      for (const purchase of card.purchases) {
        const remaining = this.remainingInstallments(purchase);
        if (remaining <= 0) continue;
        const installmentValue = this.installmentValue(purchase);
        const base =
          purchase.firstInstallmentDate && Utils.isValidDate(purchase.firstInstallmentDate)
            ? new Date(purchase.firstInstallmentDate)
            : new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        let firstPendingIndex = Utils.toNumber(purchase.paidInstallments);
        if (firstPendingIndex < 0) firstPendingIndex = 0;
        for (let i = 0; i < remaining; i += 1) {
          const instDate = new Date(base.getFullYear(), base.getMonth() + firstPendingIndex + i, 1);
          const payDate = new Date(instDate.getFullYear(), instDate.getMonth(), Utils.clampDay(card.paymentDay));
          if (payDate >= startDate && payDate <= endDate) {
            const mk = Utils.monthKey(payDate);
            if (!monthMap[mk]) {
              monthMap[mk] = 0;
            }
            monthMap[mk] += installmentValue;
          }
        }
      }
      Object.entries(monthMap).forEach(([mk, amount]) => {
        const [yy, mm] = mk.split("-").map(Number);
        const date = Utils.dateISO(new Date(yy, mm - 1, Utils.clampDay(card.paymentDay)));
        events.push({
          id: `cardpay_${card.id}_${mk}`,
          date,
          description: `Pago tarjeta ${card.name}`,
          amount: -Number(amount.toFixed(2)),
          sourceType: "card-payment",
          sourceId: card.id,
          editable: true,
        });
      });
    }
    return events;
  },

  generateCashFlow(days = 60) {
    const flowDays = Math.max(30, Math.min(60, days));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + (flowDays - 1));

    const events = [];
    const salaryDay = Utils.clampDay(Model.data.settings.salaryDay || 5);

    const monthCursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthLimit = new Date(end.getFullYear(), end.getMonth(), 1);
    while (monthCursor <= monthLimit) {
      const salaryDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), salaryDay);
      if (salaryDate >= start && salaryDate <= end) {
        events.push({
          id: `salary_${Utils.dateISO(salaryDate)}`,
          date: Utils.dateISO(salaryDate),
          description: "Salario mensual",
          amount: Utils.toNumber(Model.data.settings.salaryAmount),
          sourceType: "salary",
          sourceId: "salary",
          editable: true,
        });
      }

      for (const fixed of Model.data.fixedExpenses) {
        const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), Utils.clampDay(fixed.dueDay));
        if (d >= start && d <= end) {
          events.push({
            id: `fixed_${fixed.id}_${Utils.dateISO(d)}`,
            date: Utils.dateISO(d),
            description: `Gasto fijo: ${fixed.name}`,
            amount: -Utils.toNumber(fixed.amount),
            sourceType: "fixed",
            sourceId: fixed.id,
            editable: true,
          });
        }
      }

      for (const goal of Model.data.savingsGoals) {
        if (!goal.autoContribution || Utils.toNumber(goal.monthlyContribution) <= 0) continue;
        const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), Math.min(28, salaryDay + 1));
        if (d >= start && d <= end) {
          events.push({
            id: `goalauto_${goal.id}_${Utils.dateISO(d)}`,
            date: Utils.dateISO(d),
            description: `Aporte automatico meta: ${goal.name}`,
            amount: -Utils.toNumber(goal.monthlyContribution),
            sourceType: "goal-auto",
            sourceId: goal.id,
            editable: true,
          });
        }
      }

      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }

    Model.data.extraIncomes.forEach((x) => {
      const d = new Date(x.date);
      if (d >= start && d <= end) {
        events.push({
          id: `extra_${x.id}`,
          date: x.date,
          description: `Ingreso extra: ${x.name}`,
          amount: Utils.toNumber(x.amount),
          sourceType: "extra",
          sourceId: x.id,
          editable: true,
        });
      }
    });

    Model.data.variableExpenses.forEach((x) => {
      if (!x.paid) return;
      const d = new Date(x.date);
      if (d >= start && d <= end) {
        events.push({
          id: `variable_${x.id}`,
          date: x.date,
          description: `Gasto variable: ${x.name}`,
          amount: -Utils.toNumber(x.amount),
          sourceType: "variable",
          sourceId: x.id,
          editable: true,
        });
      }
    });

    events.push(...this.generateCardInstallmentEvents(start, end));

    Model.data.goalContributions.forEach((c) => {
      const d = new Date(c.date);
      if (d >= start && d <= end) {
        const goal = Model.data.savingsGoals.find((g) => g.id === c.goalId);
        events.push({
          id: `goalmanual_${c.id}`,
          date: c.date,
          description: `Aporte manual meta: ${goal ? goal.name : "Meta"}`,
          amount: -Utils.toNumber(c.amount),
          sourceType: "goal-manual",
          sourceId: c.id,
          editable: true,
        });
      }
    });

    Model.data.cashFlowAdjustments.forEach((adj) => {
      const d = new Date(adj.date);
      if (d >= start && d <= end) {
        events.push({
          id: `adj_${adj.id}`,
          date: adj.date,
          description: adj.description,
          amount: Utils.toNumber(adj.amount),
          sourceType: "adjustment",
          sourceId: adj.id,
          editable: true,
        });
      }
    });

    const overrides = Model.data.eventOverrides || [];
    const mapped = events
      .map((event) => {
        const ov = overrides.find((x) => x.eventId === event.id);
        if (!ov) return event;
        if (ov.deleted) return null;
        return {
          ...event,
          date: ov.date || event.date,
          amount: typeof ov.amount === "number" ? ov.amount : event.amount,
          description: ov.description || event.description,
          overridden: true,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));

    let balance = Utils.toNumber(Model.data.settings.baseBalance);
    const withBalance = mapped.map((event) => {
      balance += Utils.toNumber(event.amount);
      return {
        ...event,
        balanceAfter: Number(balance.toFixed(2)),
      };
    });

    const hasNegative = withBalance.some((e) => e.balanceAfter < 0);

    const dailyMap = {};
    withBalance.forEach((event) => {
      if (!dailyMap[event.date]) {
        dailyMap[event.date] = { items: [], net: 0, balanceAfter: 0 };
      }
      dailyMap[event.date].items.push(event);
      dailyMap[event.date].net += Utils.toNumber(event.amount);
      dailyMap[event.date].balanceAfter = event.balanceAfter;
    });

    const daily = [];
    let carryBalance = Utils.toNumber(Model.data.settings.baseBalance);
    for (let i = 0; i < flowDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = Utils.dateISO(d);
      const dayData = dailyMap[key];
      if (dayData) {
        carryBalance = Number(dayData.balanceAfter.toFixed(2));
        daily.push({
          date: key,
          eventsLabel: dayData.items.map((x) => x.description).join(" | "),
          net: Number(dayData.net.toFixed(2)),
          balanceAfter: carryBalance,
        });
      } else {
        daily.push({
          date: key,
          eventsLabel: "Sin movimientos",
          net: 0,
          balanceAfter: carryBalance,
        });
      }
    }

    return { events: withBalance, hasNegative, daily };
  },
};
