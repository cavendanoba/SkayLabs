import{a as s,r as y,c as T,T as c}from"./index-CuY4N-rM.js";import{D as C}from"./table.component-Di2JxQac.js";import{M as h}from"./modal.component-BvFy3yQw.js";const d={list:(e={})=>{const t=new URLSearchParams(e).toString();return s.get(`/transactions${t?"?"+t:""}`)},getById:e=>s.get(`/transactions/${e}`),create:e=>s.post("/transactions",e),getSummary:(e={})=>{const t=new URLSearchParams(e).toString();return s.get(`/transactions/summary${t?"?"+t:""}`)}};function i(e){return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(e||0)}const k={CONSULTATION:"Consulta",PROCEDURE:"Procedimiento",EXAM:"Examen",RENT:"Arriendo",SALARY:"Nómina",SUPPLIES:"Insumos",EQUIPMENT:"Equipos",OTHER:"Otro"},S=[{header:"Fecha",key:"createdAt",render:e=>new Date(e.createdAt).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})},{header:"Tipo",key:"type",render:e=>T(e.type)},{header:"Categoría",key:"category",render:e=>`<span class="text-sm">${k[e.category]||e.category}</span>`},{header:"Monto",key:"amount",render:e=>`<span class="fw-700 ${e.type==="INCOME"?"text-success":"text-danger"}">${i(e.amount)}</span>`},{header:"Método",key:"paymentMethod",render:e=>({CASH:"Efectivo",TRANSFER:"Transferencia",CARD:"Tarjeta",OTHER:"Otro"})[e.paymentMethod]||e.paymentMethod},{header:"Paciente",key:"patient",render:e=>e.patient?`${e.patient.firstName} ${e.patient.lastName}`:"—"},{header:"Descripción",key:"description",render:e=>`<span class="text-muted text-sm">${e.description||"—"}</span>`}];let g=1,n=null,v=null;async function l(e=1,t={}){try{n==null||n.showLoading();const a=await d.list({page:e,limit:20,...t});n==null||n.render({data:a.data,total:a.total,page:a.page,pages:a.pages}),g=a.page}catch{c.error("Error al cargar transacciones")}}async function f(){try{v=await d.getSummary(),x(v)}catch(e){console.error("Error al cargar resumen:",e)}}function x(e){const t=document.getElementById("transactions-summary");!t||!e||(t.innerHTML=`
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon text-success">↑</div>
        <div class="kpi-info">
          <div class="kpi-value text-success">${i(e.income)}</div>
          <div class="kpi-label">Ingresos totales</div>
          <div class="kpi-sub">${e.incomeCount} registros</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon text-danger">↓</div>
        <div class="kpi-info">
          <div class="kpi-value text-danger">${i(e.expense)}</div>
          <div class="kpi-label">Egresos totales</div>
          <div class="kpi-sub">${e.expenseCount} registros</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ${e.balance>=0?"text-success":"text-danger"}">≡</div>
        <div class="kpi-info">
          <div class="kpi-value ${e.balance>=0?"text-success":"text-danger"}">${i(e.balance)}</div>
          <div class="kpi-label">Balance</div>
          <div class="kpi-sub">${e.balance>=0?"Positivo":"Negativo"}</div>
        </div>
      </div>
    </div>
  `)}function R(){var p,u;const e=new h({title:"Nueva Transacción",size:"md"});e.render(`
    <form id="transaction-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Tipo *</label>
        <select name="type" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="INCOME">Ingreso</option>
          <option value="EXPENSE">Egreso</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select name="category" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CONSULTATION">Consulta</option>
          <option value="PROCEDURE">Procedimiento</option>
          <option value="EXAM">Examen</option>
          <option value="RENT">Arriendo</option>
          <option value="SALARY">Nómina</option>
          <option value="SUPPLIES">Insumos</option>
          <option value="EQUIPMENT">Equipos</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Monto (COP) *</label>
        <input type="number" name="amount" class="form-control" required placeholder="Ej: 80000" min="0" step="1000" />
      </div>
      <div class="form-group">
        <label class="form-label">Método de pago *</label>
        <select name="paymentMethod" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CASH">Efectivo</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="CARD">Tarjeta</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Descripción</label>
        <textarea name="description" class="form-control" rows="3" placeholder="Descripción opcional de la transacción..."></textarea>
      </div>
    </form>
  `,`
    <button type="button" class="btn btn-secondary" id="cancel-transaction">Cancelar</button>
    <button type="submit" form="transaction-form" class="btn btn-primary" id="save-transaction">Registrar transacción</button>
  `),(p=document.getElementById("cancel-transaction"))==null||p.addEventListener("click",()=>e.close()),(u=document.getElementById("transaction-form"))==null||u.addEventListener("submit",async m=>{m.preventDefault();const r=document.getElementById("save-transaction"),b=new FormData(m.target),o=Object.fromEntries(b.entries());o.amount=Number(o.amount),o.description||delete o.description;try{r.disabled=!0,r.textContent="Guardando...",await d.create(o),c.success("Transacción registrada exitosamente"),e.close(),l(g),f()}catch(E){c.error(E.message||"Error al registrar la transacción"),r.disabled=!1,r.textContent="Registrar transacción"}})}function A(e){y(e,`
    <div class="page-header">
      <h1 class="page-title">Caja y Transacciones</h1>
      <p class="page-subtitle">Registro de ingresos y egresos del consultorio</p>
    </div>
    <div id="transactions-summary" style="margin-bottom: 1.5rem;"></div>
    <div class="card">
      <div id="transactions-table-container"></div>
    </div>
  `);const t=document.getElementById("transactions-table-container");n=new C({container:t,columns:S,searchPlaceholder:"Buscar transacciones...",onPageChange:a=>l(a),actions:`
      <button class="btn btn-primary" id="btn-new-transaction">+ Nueva transacción</button>
    `,exportable:!0,exportFilename:"transacciones"}),n.render({loading:!0}),l(),f(),t.addEventListener("click",a=>{a.target.id==="btn-new-transaction"&&R()})}export{A as render};
