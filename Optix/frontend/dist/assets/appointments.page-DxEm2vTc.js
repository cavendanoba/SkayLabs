import{a as f}from"./appointments.service-NOCum_d4.js";import{p as h}from"./patients.service-YVROl7zF.js";import{u as $}from"./users.service-D5hnUTKZ.js";import{M as w,r as C}from"./modal.component-BvFy3yQw.js";import{r as L,T as g,c as T}from"./index-CuY4N-rM.js";let u=new Date,y=[];function E(t){const e=[],o=new Date(t),s=o.getDay(),c=new Date(o.setDate(o.getDate()-(s+6)%7));for(let m=0;m<7;m++){const a=new Date(c);a.setDate(c.getDate()+m),e.push(a)}return e}function D(t){return new Date(t).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",hour12:!1})}function I(t){return t.toLocaleDateString("es-CO",{weekday:"short",day:"numeric"})}function O(t){return{SCHEDULED:"info",CONFIRMED:"accent",WAITING:"warning",IN_PROGRESS:"warning",COMPLETED:"success",CANCELLED:"danger",NO_SHOW:"neutral"}[t]||"neutral"}function N(){const t=E(u),e=new Date().toDateString(),o=Array.from({length:14},(a,r)=>r+7),s=t.map(a=>`<div class="cal-day-header ${a.toDateString()===e?"today":""}">${I(a)}</div>`).join(""),c=(a,r)=>y.filter(l=>{const n=new Date(l.dateTime);return n.toDateString()===a.toDateString()&&n.getHours()===r}),m=o.map(a=>`
    <div class="cal-row">
      <div class="cal-hour-label">${String(a).padStart(2,"0")}:00</div>
      ${t.map(r=>{const l=c(r,a);return`
          <div class="cal-slot ${r.toDateString()===e?"today":""}" data-date="${r.toISOString()}" data-hour="${a}">
            ${l.map(i=>{var d,p,v;return`
              <div class="cal-appt cal-appt-${O(i.status)}" data-id="${i.id}">
                <div class="cal-appt-time">${D(i.dateTime)}</div>
                <div class="cal-appt-name">${(d=i.patient)==null?void 0:d.firstName} ${(p=i.patient)==null?void 0:p.lastName}</div>
                <div class="cal-appt-doctor">${(v=i.doctor)==null?void 0:v.name}</div>
              </div>
            `}).join("")}
          </div>
        `}).join("")}
    </div>
  `).join("");return`
    <div class="calendar-wrapper">
      <div class="cal-header-row">
        <div class="cal-hour-label"></div>
        ${s}
      </div>
      <div class="cal-body">${m}</div>
    </div>
  `}async function b(){try{const t=E(u),e=t[0].toISOString().split("T")[0],o=t[6].toISOString().split("T")[0];y=(await f.list({limit:100})).data||[],k()}catch{g.error("Error al cargar las citas")}}function k(){const t=document.getElementById("calendar-body");t&&(t.innerHTML=y.length>0?N():C({icon:"📅",title:"Sin citas esta semana",description:"No hay citas programadas para esta semana"}),A());const e=E(u),o=document.getElementById("cal-week-title");if(o){const s=e[0].toLocaleDateString("es-CO",{day:"numeric",month:"short"}),c=e[6].toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"});o.textContent=`${s} — ${c}`}}function A(){document.querySelectorAll(".cal-appt").forEach(t=>{t.addEventListener("click",async e=>{e.stopPropagation();const o=t.dataset.id;try{const s=await f.getById(o);M(s)}catch{g.error("Error al cargar la cita")}})}),document.querySelectorAll(".cal-slot").forEach(t=>{t.addEventListener("click",()=>{const e=new Date(t.dataset.date);e.setHours(parseInt(t.dataset.hour),0,0,0),S(e)})})}function M(t){var m,a,r,l;const e=new w({title:"Detalle de Cita",size:"md"}),o={SCHEDULED:"Agendada",CONFIRMED:"Confirmada",WAITING:"En espera",IN_PROGRESS:"En consulta",COMPLETED:"Completada",CANCELLED:"Cancelada",NO_SHOW:"No asistió"},s=`
    <div class="appt-detail">
      <div class="appt-detail-row">
        <span>Paciente</span>
        <strong>${(m=t.patient)==null?void 0:m.firstName} ${(a=t.patient)==null?void 0:a.lastName}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Médico</span>
        <strong>${(r=t.doctor)==null?void 0:r.name}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Fecha y hora</span>
        <strong>${new Date(t.dateTime).toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}, ${D(t.dateTime)}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Duración</span>
        <strong>${t.duration} minutos</strong>
      </div>
      <div class="appt-detail-row">
        <span>Estado</span>
        <strong>${T(t.status)}</strong>
      </div>
      ${t.notes?`<div class="appt-detail-row"><span>Notas</span><strong>${t.notes}</strong></div>`:""}
    </div>
    <div class="appt-status-actions" style="margin-top: 1.5rem;">
      <h4 class="text-sm text-muted mb-1">Cambiar estado:</h4>
      <div class="flex gap-sm flex-wrap">
        ${Object.entries(o).map(([n,i])=>`
          <button class="btn btn-sm ${t.status===n?"btn-primary":"btn-secondary"} appt-status-btn" data-status="${n}" data-id="${t.id}">
            ${i}
          </button>
        `).join("")}
      </div>
    </div>
  `;e.render(s,'<button class="btn btn-secondary" id="close-appt-detail">Cerrar</button>'),(l=document.getElementById("close-appt-detail"))==null||l.addEventListener("click",()=>e.close()),document.querySelectorAll(".appt-status-btn").forEach(n=>{n.addEventListener("click",async()=>{try{await f.updateStatus(n.dataset.id,n.dataset.status),g.success("Estado de la cita actualizado"),e.close(),b()}catch(i){g.error(i.message||"Error al actualizar el estado")}})})}async function S(t){var a,r;const e=new w({title:"Nueva Cita",size:"md"}),c=`
    <form id="appt-form" class="form-grid-1">
      <div class="form-group">
        <label class="form-label">Paciente *</label>
        <select name="patientId" class="form-control" required id="appt-patient-select">
          <option value="">Cargando...</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Médico *</label>
        <select name="doctorId" class="form-control" required id="appt-doctor-select">
          <option value="">Cargando...</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha y hora *</label>
        <input type="datetime-local" name="dateTime" class="form-control" required
          value="${t?t.toISOString().slice(0,16):""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de cita</label>
        <select name="appointmentType" class="form-control">
          <option value="FIRST_VISIT">Primera visita</option>
          <option value="FOLLOW_UP">Seguimiento</option>
          <option value="URGENT">Urgente</option>
          <option value="PROCEDURE">Procedimiento</option>
          <option value="EXAM">Examen</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Duración (minutos)</label>
        <select name="duration" class="form-control">
          <option value="15">15 minutos</option>
          <option value="30" selected>30 minutos</option>
          <option value="45">45 minutos</option>
          <option value="60">1 hora</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea name="notes" class="form-control" rows="3" placeholder="Notas adicionales sobre la cita..."></textarea>
      </div>
    </form>
  `;e.render(c,`
    <button type="button" class="btn btn-secondary" id="cancel-appt">Cancelar</button>
    <button type="submit" form="appt-form" class="btn btn-primary" id="save-appt">Agendar cita</button>
  `);try{const[l,n]=await Promise.all([h.list({limit:100}),$.list()]),i=document.getElementById("appt-patient-select"),d=document.getElementById("appt-doctor-select");if(i&&(i.innerHTML='<option value="">Seleccionar paciente...</option>'+l.data.map(p=>`<option value="${p.id}">${p.firstName} ${p.lastName} - ${p.document}</option>`).join("")),d){const p=n.filter(v=>v.role==="DOCTOR");d.innerHTML='<option value="">Seleccionar médico...</option>'+p.map(v=>`<option value="${v.id}">${v.name}</option>`).join("")}}catch{g.error("Error al cargar datos del formulario")}(a=document.getElementById("cancel-appt"))==null||a.addEventListener("click",()=>e.close()),(r=document.getElementById("appt-form"))==null||r.addEventListener("submit",async l=>{l.preventDefault();const n=document.getElementById("save-appt"),i=new FormData(l.target),d=Object.fromEntries(i.entries());d.duration=parseInt(d.duration),d.notes||delete d.notes;try{n.disabled=!0,n.textContent="Agendando...",await f.create(d),g.success("Cita agendada exitosamente"),e.close(),b()}catch(p){g.error(p.message||"Error al agendar la cita"),n.disabled=!1,n.textContent="Agendar cita"}})}function j(t){var e,o,s,c;L(t,`
    <div class="page-header">
      <h1 class="page-title">Agenda</h1>
      <p class="page-subtitle">Gestiona las citas del consultorio</p>
    </div>

    <div class="card">
      <div class="cal-controls">
        <div class="cal-nav">
          <button class="btn btn-secondary btn-sm" id="cal-prev">‹ Anterior</button>
          <span id="cal-week-title" class="cal-week-label"></span>
          <button class="btn btn-secondary btn-sm" id="cal-next">Siguiente ›</button>
        </div>
        <div class="cal-view-btns">
          <button class="btn btn-secondary btn-sm" id="cal-today">Hoy</button>
          <button class="btn btn-primary btn-sm" id="btn-new-appt">+ Nueva cita</button>
        </div>
      </div>
      <div id="calendar-body" style="overflow-x: auto; max-height: 70vh; overflow-y: auto;"></div>
    </div>
  `),(e=document.getElementById("cal-prev"))==null||e.addEventListener("click",()=>{u.setDate(u.getDate()-7),b()}),(o=document.getElementById("cal-next"))==null||o.addEventListener("click",()=>{u.setDate(u.getDate()+7),b()}),(s=document.getElementById("cal-today"))==null||s.addEventListener("click",()=>{u=new Date,b()}),(c=document.getElementById("btn-new-appt"))==null||c.addEventListener("click",()=>{S(new Date)}),b()}export{j as render};
