/**
 * View - Renderizado dinámico del DOM
 */
import { Utils } from "./utils.js";
import { Model } from "./model.js";
import { Calculators } from "./calculators.js";

export const View = {
  currentView: "dashboard",

  setActiveNav() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      const active = btn.dataset.view === this.currentView;
      btn.className = `nav-btn px-3 py-2 rounded-lg text-sm font-semibold transition ${
        active ? "bg-brand-600 text-white shadow" : "bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700"
      }`;
    });
  },

  showView(name) {
    this.currentView = name;
    document.querySelectorAll(".view-section").forEach((section) => {
      section.classList.toggle("hidden", section.id !== `view-${name}`);
    });
    this.setActiveNav();
    this.renderAll();
  },

  card(title, content) {
    return `
      <article class="glass rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-lg p-4 md:p-5">
        <h2 class="font-display text-xl font-bold mb-3">${title}</h2>
        ${content}
      </article>
    `;
  },

  categoryOptions(selectedId = "", type = "gasto") {
    return Model.data.categories
      .filter((c) => c.type === type || type === "any")
      .map((cat) => `<option value="${cat.id}" ${cat.id === selectedId ? "selected" : ""}>${Utils.escapeHtml(cat.name)}</option>`)
      .join("");
  },

  renderCategoryChart(data) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data.length) {
      ctx.fillStyle = "#64748b";
      ctx.font = "16px Nunito";
      ctx.fillText("Sin datos de gastos pagados este mes.", 20, 110);
      return;
    }

    const total = data.reduce((acc, x) => acc + x.spent, 0);
    let startAngle = -Math.PI / 2;
    const colors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#84cc16", "#06b6d4"];
    const centerX = 120;
    const centerY = 110;
    const radius = 80;

    data.forEach((item, idx) => {
      const angle = (item.spent / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      startAngle += angle;
    });

    ctx.font = "13px Nunito";
    data.forEach((item, idx) => {
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fillRect(230, 30 + idx * 24, 12, 12);
      ctx.fillStyle = "#334155";
      ctx.fillText(`${item.name}: ${Utils.money(item.spent)}`, 248, 40 + idx * 24);
    });
  },

  renderDashboard() {
    const dashboard = document.getElementById("view-dashboard");
    const free = Calculators.freeMoney();
    const realFree = Calculators.realFreeMoney();
    const cardsMonth = Calculators.allCardsMonthlyPayment();
    const flow = Calculators.generateCashFlow(Model.data.settings.flowDays);
    const topGoals = Model.data.savingsGoals.slice(0, 3);

    const summaryCards = `
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div class="rounded-xl bg-white/90 dark:bg-slate-800 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Dinero libre base</p>
          <p class="text-2xl font-extrabold">${Utils.money(free)}</p>
        </div>
        <div class="rounded-xl bg-white/90 dark:bg-slate-800 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Dinero libre real</p>
          <p class="text-2xl font-extrabold ${realFree < 0 ? "text-red-600" : "text-emerald-600"}">${Utils.money(realFree)}</p>
        </div>
        <div class="rounded-xl bg-white/90 dark:bg-slate-800 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Tarjetas este mes</p>
          <p class="text-2xl font-extrabold text-amber-600">${Utils.money(cardsMonth)}</p>
        </div>
        <div class="rounded-xl bg-white/90 dark:bg-slate-800 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Estado flujo proyectado</p>
          <p class="text-lg font-extrabold ${flow.hasNegative ? "text-red-600" : "text-emerald-600"}">${flow.hasNegative ? "Saldo negativo detectado" : "Saldo estable"}</p>
        </div>
      </div>
    `;

    const goalsHtml = topGoals.length
      ? topGoals
          .map((g) => {
            const pct = Math.min(100, Math.round((Utils.toNumber(g.currentAmount) / Math.max(1, Utils.toNumber(g.targetAmount))) * 100));
            return `
              <div class="mb-3 rounded-xl bg-white/80 dark:bg-slate-800 p-3">
                <div class="flex justify-between items-center">
                  <p class="font-bold">${Utils.escapeHtml(g.name)}</p>
                  <p class="text-sm">${pct}%</p>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded mt-2">
                  <div class="h-2 rounded bg-emerald-500" style="width:${pct}%"></div>
                </div>
              </div>
            `;
          })
          .join("")
      : "<p class='text-sm text-slate-500'>No hay metas registradas.</p>";

    const catData = Model.data.categories
      .filter((c) => c.type === "gasto")
      .map((c) => ({
        name: c.name,
        spent: Calculators.categorySpentCurrentMonth(c.id),
      }))
      .filter((x) => x.spent > 0);

    dashboard.innerHTML = `
      ${this.card("Resumen general", summaryCards)}
      <div class="grid lg:grid-cols-2 gap-4">
        ${this.card("Metas destacadas", goalsHtml)}
        ${this.card(
          "Distribucion de gastos por categoria",
          `
            <div class="bg-white/80 dark:bg-slate-800 rounded-xl p-3">
              <canvas id="categoryChart" height="220"></canvas>
            </div>
          `
        )}
      </div>
      ${
        flow.hasNegative
          ? this.card("Alerta", `<p class='text-red-600 font-semibold'>Tu flujo de caja proyecta saldo negativo en algun dia. Revisa la vista de flujo para reprogramar eventos.</p>`)
          : ""
      }
    `;

    this.renderCategoryChart(catData);
  },

  renderFixedExpenses() {
    const root = document.getElementById("view-fixed");
    const rows = Model.data.fixedExpenses
      .map(
        (x) => `
        <tr class="border-b border-slate-200 dark:border-slate-700">
          <td class="py-2">${Utils.escapeHtml(x.name)}</td>
          <td class="py-2">${Utils.money(x.amount)}</td>
          <td class="py-2">${Utils.escapeHtml(Model.getCategoryName(x.categoryId))}</td>
          <td class="py-2">Dia ${x.dueDay}</td>
          <td class="py-2 text-right">
            <button data-action="delete-fixed" data-id="${x.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button>
          </td>
        </tr>
      `
      )
      .join("");

    root.innerHTML = this.card(
      "Gastos fijos",
      `
        <form id="fixedForm" class="grid md:grid-cols-5 gap-2 mb-4">
          <input required name="name" placeholder="Nombre" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Monto" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <select required name="categoryId" class="px-3 py-2 rounded border bg-white dark:bg-slate-900">${this.categoryOptions("", "gasto")}</select>
          <input required name="dueDay" type="number" min="1" max="28" placeholder="Dia vencimiento" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar</button>
        </form>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Nombre</th><th>Monto</th><th>Categoria</th><th>Vence</th><th></th></tr></thead>
            <tbody>${rows || "<tr><td colspan='5' class='py-3 text-slate-500'>No hay gastos fijos.</td></tr>"}</tbody>
          </table>
        </div>
      `
    );
  },

  renderVariableExpenses() {
    const root = document.getElementById("view-variable");
    const rows = Model.data.variableExpenses
      .map(
        (x) => `
        <tr class="border-b border-slate-200 dark:border-slate-700">
          <td class="py-2">${Utils.escapeHtml(x.name)}</td>
          <td class="py-2">${Utils.money(x.amount)}</td>
          <td class="py-2">${x.date}</td>
          <td class="py-2">${Utils.escapeHtml(Model.getCategoryName(x.categoryId))}</td>
          <td class="py-2">
            <label class="inline-flex items-center gap-2">
              <input data-action="toggle-variable-paid" data-id="${x.id}" type="checkbox" ${x.paid ? "checked" : ""} />
              ${x.paid ? "Pagado" : "Pendiente"}
            </label>
          </td>
          <td class="py-2 text-right"><button data-action="delete-variable" data-id="${x.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button></td>
        </tr>
      `
      )
      .join("");

    root.innerHTML = this.card(
      "Gastos variables",
      `
        <form id="variableForm" class="grid md:grid-cols-6 gap-2 mb-4">
          <input required name="name" placeholder="Nombre" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Monto" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="date" type="date" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <select required name="categoryId" class="px-3 py-2 rounded border bg-white dark:bg-slate-900">${this.categoryOptions("", "gasto")}</select>
          <label class="px-3 py-2 rounded border bg-white dark:bg-slate-900 flex items-center gap-2"><input name="paid" type="checkbox" /> Pagado</label>
          <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar</button>
        </form>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Nombre</th><th>Monto</th><th>Fecha</th><th>Categoria</th><th>Estado</th><th></th></tr></thead>
            <tbody>${rows || "<tr><td colspan='6' class='py-3 text-slate-500'>No hay gastos variables.</td></tr>"}</tbody>
          </table>
        </div>
      `
    );
  },

  renderExtraIncomes() {
    const root = document.getElementById("view-extra");
    const rows = Model.data.extraIncomes
      .map(
        (x) => `
        <tr class="border-b border-slate-200 dark:border-slate-700">
          <td class="py-2">${Utils.escapeHtml(x.name)}</td>
          <td class="py-2">${Utils.money(x.amount)}</td>
          <td class="py-2">${x.date}</td>
          <td class="py-2">${Utils.escapeHtml(Model.getCategoryName(x.categoryId))}</td>
          <td class="py-2 text-right"><button data-action="delete-extra" data-id="${x.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button></td>
        </tr>
      `
      )
      .join("");

    root.innerHTML = this.card(
      "Ingresos extra",
      `
        <form id="extraForm" class="grid md:grid-cols-5 gap-2 mb-4">
          <input required name="name" placeholder="Nombre" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Monto" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="date" type="date" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <select required name="categoryId" class="px-3 py-2 rounded border bg-white dark:bg-slate-900">${this.categoryOptions("", "ingreso")}</select>
          <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar</button>
        </form>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Nombre</th><th>Monto</th><th>Fecha</th><th>Categoria</th><th></th></tr></thead>
            <tbody>${rows || "<tr><td colspan='5' class='py-3 text-slate-500'>No hay ingresos extra.</td></tr>"}</tbody>
          </table>
        </div>
      `
    );
  },

  renderCards() {
    const root = document.getElementById("view-cards");
    const cardList = Model.data.creditCards
      .map((card) => {
        const balance = Calculators.cardBalance(card);
        const monthPay = Calculators.cardMonthlyPayment(card);
        const limitAvailable = Math.max(0, Utils.toNumber(card.limit) - balance);
        const purchaseRows = card.purchases
          .map((p) => {
            const perInst = Calculators.installmentValue(p);
            const remInst = Calculators.remainingInstallments(p);
            const remAmount = Calculators.remainingAmount(p);
            return `
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <td class="py-2">${Utils.escapeHtml(p.name)}</td>
                <td class="py-2">${Utils.money(p.totalAmount)}</td>
                <td class="py-2">${Utils.money(perInst)}</td>
                <td class="py-2">${p.paidInstallments}/${p.totalInstallments}</td>
                <td class="py-2">${remInst}</td>
                <td class="py-2">${Utils.money(remAmount)}</td>
                <td class="py-2 text-right flex gap-1 justify-end">
                  <button data-action="pay-installment" data-card-id="${card.id}" data-purchase-id="${p.id}" class="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Pagar cuota</button>
                  <button data-action="delete-purchase" data-card-id="${card.id}" data-purchase-id="${p.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button>
                </td>
              </tr>
            `;
          })
          .join("");

        return `
          <article class="rounded-xl bg-white/85 dark:bg-slate-800 p-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <div>
                <h3 class="font-display font-bold text-lg">${Utils.escapeHtml(card.name)}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300">${Utils.escapeHtml(card.bank)} | Cierre: dia ${card.closingDay} | Pago: dia ${card.paymentDay}</p>
              </div>
              <div class="text-sm">
                <p><span class="font-semibold">Saldo actual:</span> ${Utils.money(balance)}</p>
                <p><span class="font-semibold">Limite disponible:</span> ${Utils.money(limitAvailable)}</p>
                <p><span class="font-semibold">Total mes:</span> ${Utils.money(monthPay)}</p>
              </div>
            </div>
            <form class="purchaseForm grid md:grid-cols-6 gap-2 mb-3" data-card-id="${card.id}">
              <input required name="name" placeholder="Compra" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
              <input required name="totalAmount" type="number" min="0.01" step="0.01" placeholder="Monto total" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
              <input required name="totalInstallments" type="number" min="1" step="1" placeholder="Cuotas totales" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
              <input required name="paidInstallments" type="number" min="0" step="1" placeholder="Cuotas pagadas" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
              <input name="firstInstallmentDate" type="date" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
              <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar compra</button>
            </form>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Compra</th><th>Total</th><th>Cuota</th><th>Progreso</th><th>Restantes</th><th>Restante</th><th></th></tr></thead>
                <tbody>${purchaseRows || "<tr><td colspan='7' class='py-3 text-slate-500'>Sin compras en cuotas.</td></tr>"}</tbody>
              </table>
            </div>
            <div class="mt-3 text-right">
              <button data-action="delete-card" data-id="${card.id}" class="px-3 py-2 rounded bg-red-600 text-white text-xs">Eliminar tarjeta</button>
            </div>
          </article>
        `;
      })
      .join("");

    root.innerHTML = `
      ${this.card(
        "Tarjetas de credito",
        `
          <form id="cardForm" class="grid md:grid-cols-6 gap-2 mb-4">
            <input required name="name" placeholder="Nombre tarjeta" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="bank" placeholder="Banco" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="closingDay" type="number" min="1" max="28" placeholder="Dia cierre" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="paymentDay" type="number" min="1" max="28" placeholder="Dia pago" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="limit" type="number" min="0.01" step="0.01" placeholder="Limite" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar tarjeta</button>
          </form>
          <div class="space-y-4">${cardList || "<p class='text-sm text-slate-500'>No hay tarjetas registradas.</p>"}</div>
        `
      )}
    `;
  },

  renderGoals() {
    const root = document.getElementById("view-goals");
    const goalList = Model.data.savingsGoals
      .map((g) => {
        const target = Utils.toNumber(g.targetAmount);
        const current = Utils.toNumber(g.currentAmount);
        const remain = Math.max(0, target - current);
        const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
        const required = Calculators.goalRequiredMonthly(g);
        return `
          <article class="rounded-xl bg-white/85 dark:bg-slate-800 p-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <div>
                <h3 class="font-display font-bold text-lg">${Utils.escapeHtml(g.name)}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300">Objetivo: ${Utils.money(target)} ${g.targetDate ? `| Fecha objetivo: ${g.targetDate}` : ""}</p>
              </div>
              <div class="text-sm">
                <p><span class="font-semibold">Actual:</span> ${Utils.money(current)}</p>
                <p><span class="font-semibold">Restante:</span> ${Utils.money(remain)}</p>
                <p><span class="font-semibold">Aporte mensual sugerido:</span> ${required !== null ? Utils.money(required) : "Sin fecha"}</p>
              </div>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded">
              <div class="h-3 rounded bg-emerald-500" style="width:${pct}%"></div>
            </div>
            <p class="text-xs mt-1">${pct}% alcanzado</p>
            <div class="mt-3 grid md:grid-cols-4 gap-2">
              <form class="goalContributionForm contents" data-goal-id="${g.id}">
                <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Aporte manual" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
                <input required name="date" type="date" value="${Utils.dateISO(new Date())}" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
                <button class="px-4 py-2 rounded bg-emerald-600 text-white font-bold">Agregar aporte</button>
              </form>
              <button data-action="delete-goal" data-id="${g.id}" class="px-3 py-2 rounded bg-red-600 text-white text-sm">Eliminar meta</button>
            </div>
          </article>
        `;
      })
      .join("");

    root.innerHTML = this.card(
      "Metas de ahorro",
      `
        <form id="goalForm" class="grid md:grid-cols-6 gap-2 mb-4">
          <input required name="name" placeholder="Nombre meta" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input required name="targetAmount" type="number" min="0.01" step="0.01" placeholder="Monto objetivo" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input name="currentAmount" type="number" min="0" step="0.01" value="0" placeholder="Monto actual" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input name="targetDate" type="date" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <input name="monthlyContribution" type="number" min="0" step="0.01" placeholder="Aporte mensual" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
          <label class="px-3 py-2 rounded border bg-white dark:bg-slate-900 flex items-center gap-2"><input name="autoContribution" type="checkbox" /> Aporte automatico</label>
          <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold md:col-span-6">Agregar meta</button>
        </form>
        <div class="space-y-4">${goalList || "<p class='text-sm text-slate-500'>No hay metas registradas.</p>"}</div>
      `
    );
  },

  renderCashFlow() {
    const root = document.getElementById("view-cashflow");
    const flow = Calculators.generateCashFlow(Model.data.settings.flowDays);
    const rows = flow.events
      .map(
        (e) => `
          <tr class="border-b border-slate-200 dark:border-slate-700 ${e.balanceAfter < 0 ? "bg-red-50 dark:bg-red-900/20" : ""}">
            <td class="py-2">${e.date}</td>
            <td class="py-2">${Utils.escapeHtml(e.description)} ${e.overridden ? "(editado)" : ""}</td>
            <td class="py-2 ${e.amount < 0 ? "text-red-600" : "text-emerald-600"}">${Utils.money(e.amount)}</td>
            <td class="py-2 ${e.balanceAfter < 0 ? "text-red-600 font-bold" : ""}">${Utils.money(e.balanceAfter)}</td>
            <td class="py-2 text-right flex gap-1 justify-end">
              <button data-action="edit-flow-event" data-id="${e.id}" class="px-2 py-1 rounded bg-amber-600 text-white text-xs">Editar</button>
              <button data-action="delete-flow-event" data-id="${e.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button>
            </td>
          </tr>
        `
      )
      .join("");

    const dailyRows = flow.daily
      .map(
        (d) => `
          <tr class="border-b border-slate-200 dark:border-slate-700 ${d.balanceAfter < 0 ? "bg-red-50 dark:bg-red-900/20" : ""}">
            <td class="py-2">${d.date}</td>
            <td class="py-2">${Utils.escapeHtml(d.eventsLabel)}</td>
            <td class="py-2 ${d.net < 0 ? "text-red-600" : d.net > 0 ? "text-emerald-600" : "text-slate-500"}">${Utils.money(d.net)}</td>
            <td class="py-2 ${d.balanceAfter < 0 ? "text-red-600 font-bold" : ""}">${Utils.money(d.balanceAfter)}</td>
          </tr>
        `
      )
      .join("");

    root.innerHTML = this.card(
      "Flujo de caja proyectado",
      `
        <div class="mb-4 grid md:grid-cols-4 gap-2">
          <form id="adjustmentForm" class="md:col-span-4 grid md:grid-cols-5 gap-2">
            <input required name="description" placeholder="Evento manual" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="amount" type="number" step="0.01" placeholder="Monto (+/-)" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="date" type="date" value="${Utils.dateISO(new Date())}" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar evento</button>
          </form>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Fecha</th><th>Evento</th><th>Monto</th><th>Saldo despues</th><th></th></tr></thead>
            <tbody>${rows || "<tr><td colspan='5' class='py-3 text-slate-500'>Sin eventos en el periodo.</td></tr>"}</tbody>
          </table>
        </div>
        <div class="mt-5 overflow-x-auto">
          <h3 class="font-display font-bold text-lg mb-2">Calendario diario (${Model.data.settings.flowDays} dias)</h3>
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Fecha</th><th>Eventos del dia</th><th>Flujo neto</th><th>Saldo al cierre</th></tr></thead>
            <tbody>${dailyRows}</tbody>
          </table>
        </div>
      `
    );
  },

  renderSettings() {
    const root = document.getElementById("view-settings");
    const catRows = Model.data.categories
      .map((c) => {
        const spent = c.type === "gasto" ? Calculators.categorySpentCurrentMonth(c.id) : 0;
        const over = c.type === "gasto" && Utils.toNumber(c.monthlyBudget) > 0 && spent > Utils.toNumber(c.monthlyBudget);
        return `
          <tr class="border-b border-slate-200 dark:border-slate-700 ${over ? "bg-red-50 dark:bg-red-900/20" : ""}">
            <td class="py-2">${Utils.escapeHtml(c.name)}</td>
            <td class="py-2">${Utils.escapeHtml(c.type)}</td>
            <td class="py-2">${Utils.money(c.monthlyBudget || 0)}</td>
            <td class="py-2">${c.type === "gasto" ? Utils.money(spent) : "-"}</td>
            <td class="py-2">${over ? "Sobre presupuesto" : "OK"}</td>
            <td class="py-2 text-right">
              <button data-action="edit-category" data-id="${c.id}" class="px-2 py-1 rounded bg-amber-600 text-white text-xs">Editar</button>
              <button data-action="delete-category" data-id="${c.id}" class="px-2 py-1 rounded bg-red-600 text-white text-xs">Eliminar</button>
            </td>
          </tr>
        `;
      })
      .join("");

    const overBudgetAlerts = Model.data.categories
      .filter((c) => c.type === "gasto" && Utils.toNumber(c.monthlyBudget) > 0)
      .map((c) => ({ c, spent: Calculators.categorySpentCurrentMonth(c.id) }))
      .filter((x) => x.spent > Utils.toNumber(x.c.monthlyBudget))
      .map((x) => `<li>${Utils.escapeHtml(x.c.name)}: ${Utils.money(x.spent)} de ${Utils.money(x.c.monthlyBudget)}</li>`)
      .join("");

    root.innerHTML = `
      ${this.card(
        "Configuracion general",
        `
          <form id="settingsForm" class="grid md:grid-cols-4 gap-2 mb-4">
            <input required name="salaryAmount" type="number" min="0.01" step="0.01" value="${Model.data.settings.salaryAmount}" placeholder="Salario neto" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="salaryDay" type="number" min="1" max="28" value="${Model.data.settings.salaryDay}" placeholder="Dia cobro" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <input required name="baseBalance" type="number" step="0.01" value="${Model.data.settings.baseBalance}" placeholder="Saldo inicial" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <select name="flowDays" class="px-3 py-2 rounded border bg-white dark:bg-slate-900">
              <option value="30" ${Model.data.settings.flowDays === 30 ? "selected" : ""}>30 dias</option>
              <option value="45" ${Model.data.settings.flowDays === 45 ? "selected" : ""}>45 dias</option>
              <option value="60" ${Model.data.settings.flowDays === 60 ? "selected" : ""}>60 dias</option>
            </select>
            <button class="md:col-span-4 px-4 py-2 rounded bg-brand-600 text-white font-bold">Guardar configuracion</button>
          </form>
        `
      )}
      ${this.card(
        "Categorias y presupuestos",
        `
          <form id="categoryForm" class="grid md:grid-cols-4 gap-2 mb-4">
            <input required name="name" placeholder="Nombre categoria" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <select name="type" class="px-3 py-2 rounded border bg-white dark:bg-slate-900">
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="ahorro">Ahorro</option>
            </select>
            <input name="monthlyBudget" type="number" min="0" step="0.01" placeholder="Presupuesto mensual" class="px-3 py-2 rounded border bg-white dark:bg-slate-900" />
            <button class="px-4 py-2 rounded bg-brand-600 text-white font-bold">Agregar categoria</button>
          </form>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="text-left border-b border-slate-300 dark:border-slate-700"><th>Nombre</th><th>Tipo</th><th>Presupuesto</th><th>Gastado mes</th><th>Estado</th><th></th></tr></thead>
              <tbody>${catRows || "<tr><td colspan='6' class='py-3 text-slate-500'>No hay categorias.</td></tr>"}</tbody>
            </table>
          </div>
        `
      )}
      ${
        overBudgetAlerts
          ? this.card("Alertas de presupuesto", `<ul class='list-disc pl-5 text-red-600 font-semibold'>${overBudgetAlerts}</ul>`)
          : ""
      }
    `;
  },

  renderAll() {
    this.renderDashboard();
    this.renderFixedExpenses();
    this.renderVariableExpenses();
    this.renderExtraIncomes();
    this.renderCards();
    this.renderGoals();
    this.renderCashFlow();
    this.renderSettings();
  },
};
