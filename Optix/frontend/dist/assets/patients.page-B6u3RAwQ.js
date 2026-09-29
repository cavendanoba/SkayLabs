import{p as f}from"./patients.service-YVROl7zF.js";import{D as y}from"./table.component-Di2JxQac.js";import{M as v}from"./modal.component-BvFy3yQw.js";import{r as h,T as m}from"./index-CuY4N-rM.js";const N=[{header:"Paciente",key:"name",render:e=>`
      <div class="cell-patient">
        <div class="cell-avatar">${e.firstName[0]}${e.lastName[0]}</div>
        <div>
          <div class="fw-600">${e.firstName} ${e.lastName}</div>
          <div class="text-muted text-sm">${e.document}</div>
        </div>
      </div>
    `,csvValue:e=>`${e.firstName} ${e.lastName}`},{header:"Documento",key:"document",render:e=>`<span class="text-muted text-sm">${e.documentType}: ${e.document}</span>`,csvValue:e=>`${e.documentType}: ${e.document}`},{header:"Teléfono",key:"phoneNumber",render:e=>e.phoneNumber||"—"},{header:"Email",key:"email",render:e=>e.email||"—"},{header:"Ciudad",key:"city",render:e=>e.city||"—"}];let g=1,b="",s=null;async function u(e="",t=1){try{s==null||s.showLoading();const a=await f.list({search:e,page:t,limit:20});s==null||s.render({data:a.data,total:a.total,page:a.page,pages:a.pages}),g=a.page,b=e}catch(a){m.error("Error al cargar pacientes: "+(a.message||"Error desconocido"))}}function $(){var p,i;const e=new v({title:"Nuevo Paciente",size:"lg"});e.render(`
    <form id="patient-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="firstName" class="form-control" required placeholder="Nombre del paciente" />
      </div>
      <div class="form-group">
        <label class="form-label">Apellidos *</label>
        <input type="text" name="lastName" class="form-control" required placeholder="Apellidos del paciente" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de documento *</label>
        <select name="documentType" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CC">Cédula de Ciudadanía</option>
          <option value="CE">Cédula de Extranjería</option>
          <option value="PA">Pasaporte</option>
          <option value="RC">Registro Civil</option>
          <option value="TI">Tarjeta de Identidad</option>
          <option value="NIT">NIT</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Número de documento *</label>
        <input type="text" name="document" class="form-control" required placeholder="Ej: 1234567890" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" placeholder="Ej: 3001234567" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" placeholder="correo@ejemplo.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de nacimiento</label>
        <input type="date" name="birthDate" class="form-control" />
      </div>
      <div class="form-group">
        <label class="form-label">Género</label>
        <select name="gender" class="form-control">
          <option value="">Seleccionar...</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Dirección</label>
        <input type="text" name="address" class="form-control" placeholder="Dirección completa" />
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input type="text" name="city" class="form-control" placeholder="Ciudad de residencia" />
      </div>
      <div class="form-group">
        <label class="form-label">Barrio</label>
        <input type="text" name="neighborhood" class="form-control" placeholder="Barrio o localidad" />
      </div>
      <div class="form-group">
        <label class="form-label">Contacto de emergencia</label>
        <input type="text" name="emergencyName" class="form-control" placeholder="Nombre del contacto" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono de emergencia</label>
        <input type="tel" name="emergencyPhone" class="form-control" placeholder="Teléfono del contacto" />
      </div>
    </form>
  `,`
    <button type="button" class="btn btn-secondary" id="cancel-patient">Cancelar</button>
    <button type="submit" form="patient-form" class="btn btn-primary" id="save-patient">
      Guardar paciente
    </button>
  `),(p=document.getElementById("cancel-patient"))==null||p.addEventListener("click",()=>e.close()),(i=document.getElementById("patient-form"))==null||i.addEventListener("submit",async d=>{d.preventDefault();const o=document.getElementById("save-patient"),r=new FormData(d.target),n=Object.fromEntries(r.entries());Object.keys(n).forEach(l=>{n[l]||delete n[l]});try{o.disabled=!0,o.textContent="Guardando...",await f.create(n),m.success("Paciente creado exitosamente"),e.close(),u(b,g)}catch(l){m.error(l.message||"Error al crear el paciente"),o.disabled=!1,o.textContent="Guardar paciente"}})}function E(e){var i,d;const t=new v({title:"Editar Paciente",size:"lg"}),a=`
    <form id="edit-patient-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="firstName" class="form-control" required value="${e.firstName}" />
      </div>
      <div class="form-group">
        <label class="form-label">Apellidos *</label>
        <input type="text" name="lastName" class="form-control" required value="${e.lastName}" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" value="${e.phoneNumber||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" value="${e.email||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input type="text" name="city" class="form-control" value="${e.city||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Barrio</label>
        <input type="text" name="neighborhood" class="form-control" value="${e.neighborhood||""}" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Dirección</label>
        <input type="text" name="address" class="form-control" value="${e.address||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Contacto de emergencia</label>
        <input type="text" name="emergencyName" class="form-control" value="${e.emergencyName||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono de emergencia</label>
        <input type="tel" name="emergencyPhone" class="form-control" value="${e.emergencyPhone||""}" />
      </div>
    </form>
  `;t.render(a,`
    <button type="button" class="btn btn-secondary" id="cancel-edit-patient">Cancelar</button>
    <button type="submit" form="edit-patient-form" class="btn btn-primary" id="save-edit-patient">
      Guardar cambios
    </button>
  `),(i=document.getElementById("cancel-edit-patient"))==null||i.addEventListener("click",()=>t.close()),(d=document.getElementById("edit-patient-form"))==null||d.addEventListener("submit",async o=>{o.preventDefault();const r=document.getElementById("save-edit-patient"),n=new FormData(o.target),l=Object.fromEntries(n.entries());Object.keys(l).forEach(c=>{l[c]||(l[c]=null)});try{r.disabled=!0,r.textContent="Guardando...",await f.update(e.id,l),m.success("Paciente actualizado exitosamente"),t.close(),u(b,g)}catch(c){m.error(c.message||"Error al actualizar el paciente"),r.disabled=!1,r.textContent="Guardar cambios"}})}async function x(e){try{const t=await f.getById(e);T(t)}catch{m.error("Error al cargar el paciente")}}function T(e){var o,r,n;const t=new v({title:`${e.firstName} ${e.lastName}`,size:"lg"}),a=e.birthDate?new Date(e.birthDate).toLocaleDateString("es-CO"):"No registrada",p=((o=e.appointments)==null?void 0:o.slice(0,3).map(l=>{var c;return`
    <div class="detail-list-item">
      <span>${new Date(l.dateTime).toLocaleDateString("es-CO")}</span>
      <span class="text-muted">${((c=l.doctor)==null?void 0:c.name)||"—"}</span>
    </div>
  `}).join(""))||'<p class="text-muted text-sm">Sin citas registradas</p>',i=`
    <div class="patient-detail">
      <div class="patient-detail-hero">
        <div class="patient-avatar-lg">${e.firstName[0]}${e.lastName[0]}</div>
        <div>
          <h4>${e.firstName} ${e.lastName}</h4>
          <p class="text-muted">${e.documentType}: ${e.document}</p>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-section">
          <h5 class="detail-section-title">Información personal</h5>
          <div class="detail-field"><span>Teléfono</span><strong>${e.phoneNumber||"—"}</strong></div>
          <div class="detail-field"><span>Email</span><strong>${e.email||"—"}</strong></div>
          <div class="detail-field"><span>Fecha de nacimiento</span><strong>${a}</strong></div>
          <div class="detail-field"><span>Género</span><strong>${e.gender==="M"?"Masculino":e.gender==="F"?"Femenino":e.gender||"—"}</strong></div>
          <div class="detail-field"><span>Ciudad</span><strong>${e.city||"—"}</strong></div>
          <div class="detail-field"><span>Dirección</span><strong>${e.address||"—"}</strong></div>
        </div>
        <div class="detail-section">
          <h5 class="detail-section-title">Últimas citas</h5>
          ${p}
        </div>
      </div>
    </div>
  `;t.render(i,`
    <button class="btn btn-secondary" id="close-patient-detail">Cerrar</button>
    <button class="btn btn-primary" id="edit-patient-detail">Editar paciente</button>
  `),(r=document.getElementById("close-patient-detail"))==null||r.addEventListener("click",()=>t.close()),(n=document.getElementById("edit-patient-detail"))==null||n.addEventListener("click",()=>{t.close(),setTimeout(()=>E(e),350)})}function B(e){h(e,`
    <div class="page-header">
      <h1 class="page-title">Pacientes</h1>
      <p class="page-subtitle">Gestiona los registros de pacientes del consultorio</p>
    </div>
    <div class="card">
      <div id="patients-table-container"></div>
    </div>
  `);const t=document.getElementById("patients-table-container");s=new y({container:t,columns:N,searchPlaceholder:"Buscar por nombre, documento, teléfono...",onRowClick:x,onSearch:a=>u(a,1),onPageChange:a=>u(b,a),actions:`
      <button class="btn btn-primary" id="btn-new-patient">+ Nuevo paciente</button>
    `,exportable:!0,exportFilename:"pacientes"}),s.render({loading:!0}),u(),t.addEventListener("click",a=>{a.target.id==="btn-new-patient"&&$()})}export{B as render};
