import{a as S,r as M,T as x,c as H,b as T}from"./index-CuY4N-rM.js";import{p as F}from"./patients.service-YVROl7zF.js";import{a as q}from"./appointments.service-NOCum_d4.js";import{u as R}from"./users.service-D5hnUTKZ.js";import{D as G}from"./table.component-Di2JxQac.js";import{M as _}from"./modal.component-BvFy3yQw.js";const D={list:(e={})=>{const t=new URLSearchParams(e).toString();return S.get(`/hx-records${t?"?"+t:""}`)},getById:e=>S.get(`/hx-records/${e}`),create:e=>S.post("/hx-records",e),update:(e,t)=>S.put(`/hx-records/${e}`,t),finalize:e=>S.post(`/hx-records/${e}/finalize`,{})};let E=null,V=1,P="";const Q=[{header:"Paciente",key:"patient",render:e=>{const t=e.patient;return t?`
        <div class="cell-patient">
          <div class="cell-avatar">${t.firstName[0]}${t.lastName[0]}</div>
          <div>
            <div class="fw-600">${t.firstName} ${t.lastName}</div>
            <div class="text-muted text-sm">${t.document||""}</div>
          </div>
        </div>
      `:"—"}},{header:"Médico",key:"doctor",render:e=>{var t;return((t=e.doctor)==null?void 0:t.name)||"—"}},{header:"Fecha",key:"createdAt",render:e=>new Date(e.createdAt).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})},{header:"Estado",key:"status",render:e=>H(e.status)},{header:"Motivo",key:"chiefComplaint",render:e=>{const t=e.chiefComplaint||"—";return`<span title="${t}" class="text-truncate" style="max-width:200px;display:block">${t.length>40?t.slice(0,40)+"...":t}</span>`}}];async function C(e="",t=1){try{E==null||E.showLoading();const a={page:t,limit:20},s=await D.list(a);E==null||E.render({data:s.data,total:s.total,page:s.page,pages:s.pages}),V=s.page,P=e}catch(a){x.error("Error al cargar historias clínicas: "+(a.message||"Error desconocido"))}}function O(e,t,a,s=!1){return`
    <div class="hx-accordion ${s?"open":""}" id="acc-${e}">
      <button class="hx-accordion-header" type="button" data-acc="${e}" aria-expanded="${s}">
        <span>${t}</span>
        <svg class="acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
      </button>
      <div class="hx-accordion-body">
        ${a}
      </div>
    </div>
  `}function w(e,t){return`
    <div class="hx-eye-pair">
      <div class="form-group">
        <label class="form-label">${e} — OD</label>
        <input type="text" name="${t}OD" class="form-control" placeholder="Ojo Derecho" />
      </div>
      <div class="form-group">
        <label class="form-label">${e} — OI</label>
        <input type="text" name="${t}OS" class="form-control" placeholder="Ojo Izquierdo" />
      </div>
    </div>
  `}function L(e=null){const t=l=>(e==null?void 0:e[l])||"",a=(e==null?void 0:e.ophthalmology)||{},s=(e==null?void 0:e.diagnoses)||[],d=(e==null?void 0:e.prescriptions)||[],g=`
    <div class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Motivo de consulta</label>
        <textarea name="chiefComplaint" class="form-control" rows="3" placeholder="Descripción del motivo de consulta...">${t("chiefComplaint")}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Antecedentes médicos</label>
        <textarea name="medicalHistory" class="form-control" rows="3" placeholder="Antecedentes sistémicos relevantes...">${t("medicalHistory")}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Antecedentes quirúrgicos</label>
        <textarea name="surgicalHistory" class="form-control" rows="3" placeholder="Cirugías previas...">${t("surgicalHistory")}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Alergias</label>
        <input type="text" name="allergies" class="form-control" placeholder="Alergias conocidas" value="${t("allergies")}" />
      </div>
      <div class="form-group">
        <label class="form-label">Medicamentos actuales</label>
        <input type="text" name="medications" class="form-control" placeholder="Medicamentos en uso" value="${t("medications")}" />
      </div>
    </div>
  `,n=`
    <div class="hx-eye-section">
      ${w("Agudeza visual SC","visualAcuity")}
      <div class="hx-eye-pair">
        <div class="form-group">
          <label class="form-label">Agudeza visual CC — OD</label>
          <input type="text" name="visualAcuityCCOD" class="form-control" placeholder="Con corrección OD" value="${a.visualAcuityOD||""}" />
        </div>
        <div class="form-group">
          <label class="form-label">Agudeza visual CC — OI</label>
          <input type="text" name="visualAcuityCCOS" class="form-control" placeholder="Con corrección OI" value="${a.visualAcuityOS||""}" />
        </div>
      </div>
    </div>
  `,f=`
    <div class="hx-eye-section">
      ${w("Esfera","sphere")}
      ${w("Cilindro","cylinder")}
      ${w("Eje","axis")}
      <div class="form-group form-group-full">
        <label class="form-label">Adición</label>
        <input type="text" name="addition" class="form-control" placeholder="Adición para lectura" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Notas de refracción</label>
        <input type="text" name="refractionNotes" class="form-control" placeholder="Observaciones adicionales" value="${a.refractionOD||""}" />
      </div>
    </div>
  `,v=`
    <div class="hx-eye-pair">
      <div class="form-group">
        <label class="form-label">Tonometría — OD (mmHg)</label>
        <input type="number" name="iop_od" class="form-control" placeholder="Ej: 14" value="${a.intraocularPressureOD||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tonometría — OI (mmHg)</label>
        <input type="number" name="iop_os" class="form-control" placeholder="Ej: 15" value="${a.intraocularPressureOS||""}" />
      </div>
    </div>
  `,b=`
    <div class="hx-eye-section">
      <div class="form-group form-group-full">
        <label class="form-label">Biomicroscopía — OD</label>
        <textarea name="biomicroscopyOD" class="form-control" rows="3" placeholder="Hallazgos en segmento anterior OD...">${a.biomicroscopyOD||""}</textarea>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Biomicroscopía — OI</label>
        <textarea name="biomicroscopyOS" class="form-control" rows="3" placeholder="Hallazgos en segmento anterior OI...">${a.biomicroscopyOS||""}</textarea>
      </div>
    </div>
  `,h=`
    <div class="hx-eye-section">
      <div class="form-group form-group-full">
        <label class="form-label">Fondo de ojo — OD</label>
        <textarea name="fundusOD" class="form-control" rows="3" placeholder="Hallazgos en segmento posterior OD...">${a.fundusOD||""}</textarea>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Fondo de ojo — OI</label>
        <textarea name="fundusOS" class="form-control" rows="3" placeholder="Hallazgos en segmento posterior OI...">${a.fundusOS||""}</textarea>
      </div>
    </div>
  `,m=`
    <div id="hx-diagnoses-list">
      ${s.map((l,o)=>`
    <div class="hx-diag-row" data-idx="${o}">
      <input type="text" name="diag_code_${o}" class="form-control" placeholder="Código CIE-10 (ej: H52.1)" value="${l.cie10Code}" />
      <label class="hx-diag-primary-label">
        <input type="checkbox" name="diag_primary_${o}" ${l.isPrimary?"checked":""} /> Principal
      </label>
      <button type="button" class="btn btn-sm btn-danger hx-diag-remove" data-idx="${o}">✕</button>
    </div>
  `).join("")||'<p class="text-muted text-sm mb-2">Sin diagnósticos agregados</p>'}
    </div>
    <button type="button" class="btn btn-secondary btn-sm" id="btn-add-diagnosis">+ Agregar diagnóstico</button>
  `,u=d.map((l,o)=>`
    <div class="hx-presc-row" data-idx="${o}">
      <div class="form-group">
        <label class="form-label">Medicamento</label>
        <input type="text" name="presc_med_${o}" class="form-control" placeholder="Nombre del medicamento" value="${l.medicationName}" />
      </div>
      <div class="form-group">
        <label class="form-label">Dosis</label>
        <input type="text" name="presc_dosage_${o}" class="form-control" placeholder="Ej: 1 gota" value="${l.dosage||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Frecuencia</label>
        <input type="text" name="presc_freq_${o}" class="form-control" placeholder="Ej: 3 veces al día" value="${l.frequency||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">Duración</label>
        <input type="text" name="presc_dur_${o}" class="form-control" placeholder="Ej: 7 días" value="${l.duration||""}" />
      </div>
      <button type="button" class="btn btn-sm btn-danger hx-presc-remove mt-2" data-idx="${o}">✕ Quitar</button>
    </div>
  `).join(""),c=`
    <div class="form-group form-group-full">
      <label class="form-label">Plan de tratamiento</label>
      <textarea name="plan" class="form-control" rows="3" placeholder="Plan de manejo y recomendaciones...">${a.plan||""}</textarea>
    </div>
    <h5 class="mt-2 mb-1 text-sm fw-600">Prescripciones</h5>
    <div id="hx-presc-list">
      ${u||'<p class="text-muted text-sm mb-2">Sin prescripciones</p>'}
    </div>
    <button type="button" class="btn btn-secondary btn-sm" id="btn-add-presc">+ Agregar prescripción</button>
  `;return`
    <form id="hx-form">
      ${O("anamnesis","1. Anamnesis y Antecedentes",g,!0)}
      ${O("av","2. Agudeza Visual",n)}
      ${O("refraction","3. Refracción",f)}
      ${O("tono","4. Tonometría",v)}
      ${O("biomicro","5. Biomicroscopía",b)}
      ${O("fondo","6. Fondo de Ojo",h)}
      ${O("dx","7. Diagnóstico CIE-10",m)}
      ${O("plan","8. Plan y Prescripciones",c)}
    </form>
  `}function j(){document.querySelectorAll("[data-acc]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.acc,s=document.getElementById(`acc-${t}`).classList.toggle("open");e.setAttribute("aria-expanded",s)})})}function N(){var a,s;let e=document.querySelectorAll(".hx-diag-row").length;(a=document.getElementById("btn-add-diagnosis"))==null||a.addEventListener("click",()=>{const d=document.getElementById("hx-diagnoses-list"),g=d.querySelector("p");g&&g.remove();const n=document.createElement("div");n.className="hx-diag-row",n.dataset.idx=e,n.innerHTML=`
      <input type="text" name="diag_code_${e}" class="form-control" placeholder="Código CIE-10 (ej: H52.1)" />
      <label class="hx-diag-primary-label">
        <input type="checkbox" name="diag_primary_${e}" /> Principal
      </label>
      <button type="button" class="btn btn-sm btn-danger hx-diag-remove" data-idx="${e}">✕</button>
    `,d.appendChild(n),e++,A(".hx-diag-remove",".hx-diag-row")});let t=document.querySelectorAll(".hx-presc-row").length;(s=document.getElementById("btn-add-presc"))==null||s.addEventListener("click",()=>{const d=document.getElementById("hx-presc-list"),g=d.querySelector("p");g&&g.remove();const n=document.createElement("div");n.className="hx-presc-row",n.dataset.idx=t,n.innerHTML=`
      <div class="form-group">
        <label class="form-label">Medicamento</label>
        <input type="text" name="presc_med_${t}" class="form-control" placeholder="Nombre del medicamento" />
      </div>
      <div class="form-group">
        <label class="form-label">Dosis</label>
        <input type="text" name="presc_dosage_${t}" class="form-control" placeholder="Ej: 1 gota" />
      </div>
      <div class="form-group">
        <label class="form-label">Frecuencia</label>
        <input type="text" name="presc_freq_${t}" class="form-control" placeholder="Ej: 3 veces al día" />
      </div>
      <div class="form-group">
        <label class="form-label">Duración</label>
        <input type="text" name="presc_dur_${t}" class="form-control" placeholder="Ej: 7 días" />
      </div>
      <button type="button" class="btn btn-sm btn-danger hx-presc-remove mt-2" data-idx="${t}">✕ Quitar</button>
    `,d.appendChild(n),t++,A(".hx-presc-remove",".hx-presc-row")}),A(".hx-diag-remove",".hx-diag-row"),A(".hx-presc-remove",".hx-presc-row")}function A(e,t){document.querySelectorAll(e).forEach(a=>{a.replaceWith(a.cloneNode(!0))}),document.querySelectorAll(e).forEach(a=>{a.addEventListener("click",()=>{const s=a.dataset.idx,d=document.querySelector(`${t}[data-idx="${s}"]`);d==null||d.remove()})})}function z(e){const t=new FormData(e),a={},s={},d=[],g=[];["chiefComplaint","medicalHistory","surgicalHistory","allergies","medications"].forEach(p=>{var $;const y=($=t.get(p))==null?void 0:$.trim();y&&(a[p]=y)});const n=p=>{var y;return((y=t.get(p))==null?void 0:y.trim())||""},f=n("sphereOD"),v=n("cylinderOD"),b=n("axisOD"),h=n("sphereOS"),r=n("cylinderOS"),m=n("axisOS"),u=[f&&`Esf: ${f}`,v&&`Cil: ${v}`,b&&`Eje: ${b}`].filter(Boolean).join(" · "),c=[h&&`Esf: ${h}`,r&&`Cil: ${r}`,m&&`Eje: ${m}`].filter(Boolean).join(" · ");Object.entries({visualAcuityOD:"visualAcuityCCOD",visualAcuityOS:"visualAcuityCCOS",intraocularPressureOD:"iop_od",intraocularPressureOS:"iop_os",biomicroscopyOD:"biomicroscopyOD",biomicroscopyOS:"biomicroscopyOS",fundusOD:"fundusOD",fundusOS:"fundusOS",plan:"plan"}).forEach(([p,y])=>{const $=n(y);$&&(s[p]=["intraocularPressureOD","intraocularPressureOS"].includes(p)?Number($):$)}),u&&(s.refractionOD=u),c&&(s.refractionOS=c);let o=0;for(;t.has(`diag_code_${o}`);){const p=t.get(`diag_code_${o}`);p&&d.push({cie10Code:p,isPrimary:t.has(`diag_primary_${o}`)}),o++}let i=0;for(;t.has(`presc_med_${i}`);){const p=t.get(`presc_med_${i}`);p&&g.push({medicationName:p,dosage:t.get(`presc_dosage_${i}`)||void 0,frequency:t.get(`presc_freq_${i}`)||void 0,duration:t.get(`presc_dur_${i}`)||void 0}),i++}return{...a,ophthalmology:Object.keys(s).length?s:void 0,diagnoses:d,prescriptions:g}}async function U(){var f,v,b,h;const e=new _({title:"Nueva Historia Clínica",size:"xl"});e.render(`
    <div class="form-grid-2 mb-2">
      <div class="form-group">
        <label class="form-label">Paciente *</label>
        <select id="hx-patient-select" class="form-control" required><option value="">Cargando...</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">Médico *</label>
        <select id="hx-doctor-select" class="form-control" required><option value="">Cargando...</option></select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Cita asociada</label>
        <select id="hx-appt-select" class="form-control"><option value="">Ninguna cita asociada</option></select>
      </div>
    </div>
    <hr class="mb-2" style="border-color: var(--color-border);" />
  `+L(),`
    <button class="btn btn-secondary" id="cancel-hx">Cancelar</button>
    <button class="btn btn-secondary" id="save-hx-draft">Guardar borrador</button>
    <button class="btn btn-primary" id="save-hx-finalize">Guardar y finalizar</button>
  `),j(),N();try{const[r,m]=await Promise.all([F.list({limit:100}),R.list()]),u=document.getElementById("hx-patient-select"),c=document.getElementById("hx-doctor-select");if(u&&(u.innerHTML='<option value="">Seleccionar paciente...</option>'+r.data.map(l=>`<option value="${l.id}">${l.firstName} ${l.lastName} — ${l.document}</option>`).join("")),c){const l=m.filter(i=>i.role==="DOCTOR"),o=T.getLocalUser();c.innerHTML='<option value="">Seleccionar médico...</option>'+l.map(i=>`<option value="${i.id}" ${i.id===(o==null?void 0:o.id)?"selected":""}>${i.name}</option>`).join("")}}catch{x.error("Error al cargar datos")}(f=document.getElementById("cancel-hx"))==null||f.addEventListener("click",()=>e.close());async function g(r){const m=document.getElementById("hx-appt-select");if(m){if(!r){m.innerHTML='<option value="">Seleccionar cita...</option>';return}m.innerHTML='<option value="">Cargando...</option>';try{const u=await q.list({patientId:r,status:"CONFIRMED,SCHEDULED,WAITING,IN_PROGRESS",limit:50}),c=u.data||u;m.innerHTML='<option value="">Sin cita asociada</option>'+c.map(l=>{const o=new Date(l.dateTime).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});return`<option value="${l.id}">${o} — ${l.appointmentType}</option>`}).join("")}catch{m.innerHTML='<option value="">Error al cargar citas</option>'}}}(v=document.getElementById("hx-patient-select"))==null||v.addEventListener("change",r=>{g(r.target.value)});async function n(r=!1){var y,$,B;const m=(y=document.getElementById("hx-patient-select"))==null?void 0:y.value,u=($=document.getElementById("hx-doctor-select"))==null?void 0:$.value,c=(B=document.getElementById("hx-appt-select"))==null?void 0:B.value;if(!m||!u){x.warning("Selecciona paciente y médico");return}const l=document.getElementById("hx-form"),o=z(l),i=r?document.getElementById("save-hx-finalize"):document.getElementById("save-hx-draft"),p=i.textContent;i.disabled=!0,i.textContent="Guardando...";try{const I={...o,patientId:m,doctorId:u};c&&(I.appointmentId=c);const k=await D.create(I);r&&await D.finalize(k.id),x.success(r?"Historia clínica finalizada":"Borrador guardado"),e.close(),C()}catch(I){x.error(I.message||"Error al guardar"),i.disabled=!1,i.textContent=p}}(b=document.getElementById("save-hx-draft"))==null||b.addEventListener("click",()=>n(!1)),(h=document.getElementById("save-hx-finalize"))==null||h.addEventListener("click",()=>n(!0))}async function W(e){try{const t=await D.getById(e);J(t)}catch{x.error("Error al cargar la historia clínica")}}function J(e){var f,v,b,h,r,m,u,c,l,o;const t=new _({title:`Historia Clínica — ${(f=e.patient)==null?void 0:f.firstName} ${(v=e.patient)==null?void 0:v.lastName}`,size:"xl"}),a=e.ophthalmology,s=(b=e.diagnoses)!=null&&b.length?e.diagnoses.map(i=>{var p;return`
        <div class="hx-diag-display">
          <strong class="text-accent">${i.cie10Code}</strong>
          <span>${((p=i.cie10)==null?void 0:p.description)||"—"}</span>
          ${i.isPrimary?'<span class="badge badge-success">Principal</span>':""}
        </div>
      `}).join(""):'<p class="text-muted text-sm">Sin diagnósticos registrados</p>',d=(h=e.prescriptions)!=null&&h.length?e.prescriptions.map(i=>`
        <div class="hx-presc-display">
          <strong>${i.medicationName}</strong>
          <span class="text-muted">${[i.dosage,i.frequency,i.duration].filter(Boolean).join(" · ")}</span>
        </div>
      `).join(""):'<p class="text-muted text-sm">Sin prescripciones</p>',g=`
    <div class="hx-detail-header">
      <div class="detail-field"><span>Paciente</span><strong>${(r=e.patient)==null?void 0:r.firstName} ${(m=e.patient)==null?void 0:m.lastName}</strong></div>
      <div class="detail-field"><span>Médico</span><strong>${(u=e.doctor)==null?void 0:u.name}</strong></div>
      <div class="detail-field"><span>Fecha</span><strong>${new Date(e.createdAt).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"})}</strong></div>
      <div class="detail-field"><span>Estado</span><strong>${H(e.status)}</strong></div>
    </div>
    <hr style="border-color:var(--color-border);margin:1rem 0;" />

    ${e.chiefComplaint?`<div class="form-group"><label class="form-label">Motivo de consulta</label><p class="form-static">${e.chiefComplaint}</p></div>`:""}
    ${e.medicalHistory?`<div class="form-group"><label class="form-label">Antecedentes médicos</label><p class="form-static">${e.medicalHistory}</p></div>`:""}

    ${a?`
    <h5 class="mt-2 mb-1">Oftalmología</h5>
    <div class="hx-opth-grid">
      ${a.visualAcuityOD?`<div class="detail-field"><span>AV OD</span><strong>${a.visualAcuityOD}</strong></div>`:""}
      ${a.visualAcuityOS?`<div class="detail-field"><span>AV OI</span><strong>${a.visualAcuityOS}</strong></div>`:""}
      ${a.intraocularPressureOD?`<div class="detail-field"><span>PIO OD</span><strong>${a.intraocularPressureOD} mmHg</strong></div>`:""}
      ${a.intraocularPressureOS?`<div class="detail-field"><span>PIO OI</span><strong>${a.intraocularPressureOS} mmHg</strong></div>`:""}
      ${a.biomicroscopyOD?`<div class="detail-field form-group-full"><span>Biomicro OD</span><strong>${a.biomicroscopyOD}</strong></div>`:""}
      ${a.biomicroscopyOS?`<div class="detail-field form-group-full"><span>Biomicro OI</span><strong>${a.biomicroscopyOS}</strong></div>`:""}
      ${a.fundusOD?`<div class="detail-field form-group-full"><span>Fondo OD</span><strong>${a.fundusOD}</strong></div>`:""}
      ${a.fundusOS?`<div class="detail-field form-group-full"><span>Fondo OI</span><strong>${a.fundusOS}</strong></div>`:""}
      ${a.plan?`<div class="detail-field form-group-full"><span>Plan</span><strong>${a.plan}</strong></div>`:""}
    </div>
    `:""}

    <h5 class="mt-2 mb-1">Diagnósticos</h5>
    ${s}

    <h5 class="mt-2 mb-1">Prescripciones</h5>
    ${d}
  `,n=e.status==="DRAFT"?`
      <button class="btn btn-secondary" id="close-hx-detail">Cerrar</button>
      <button class="btn btn-warning" id="edit-hx-btn" data-id="${e.id}">✏️ Editar</button>
      <button class="btn btn-primary" id="finalize-hx-btn" data-id="${e.id}">Finalizar historia</button>
    `:'<button class="btn btn-secondary" id="close-hx-detail">Cerrar</button>';t.render(g,n),(c=document.getElementById("close-hx-detail"))==null||c.addEventListener("click",()=>t.close()),(l=document.getElementById("edit-hx-btn"))==null||l.addEventListener("click",()=>{t.close(),X(e)}),(o=document.getElementById("finalize-hx-btn"))==null||o.addEventListener("click",async i=>{try{await D.finalize(i.target.dataset.id),x.success("Historia clínica finalizada"),t.close(),C()}catch(p){x.error(p.message||"Error al finalizar")}})}async function X(e){var s,d,g,n,f,v,b,h;const t=new _({title:`Editar Historia — ${(s=e.patient)==null?void 0:s.firstName} ${(d=e.patient)==null?void 0:d.lastName}`,size:"xl"});t.render(`
    <div class="form-group mb-2">
      <p class="text-muted text-sm">Paciente: <strong>${(g=e.patient)==null?void 0:g.firstName} ${(n=e.patient)==null?void 0:n.lastName}</strong> · Médico: <strong>${(f=e.doctor)==null?void 0:f.name}</strong></p>
    </div>
    <hr style="border-color:var(--color-border);margin-bottom:1rem;" />
    ${L(e)}
  `,`
    <button class="btn btn-secondary" id="cancel-hx-edit">Cancelar</button>
    <button class="btn btn-secondary" id="save-hx-edit-draft">Guardar borrador</button>
    <button class="btn btn-primary" id="save-hx-edit-finalize">Guardar y finalizar</button>
  `),j(),N(),(v=document.getElementById("cancel-hx-edit"))==null||v.addEventListener("click",()=>t.close());async function a(r=!1){const m=document.getElementById("hx-form"),u=z(m),c=r?document.getElementById("save-hx-edit-finalize"):document.getElementById("save-hx-edit-draft"),l=c.textContent;c.disabled=!0,c.textContent="Guardando...";try{await D.update(e.id,u),r&&await D.finalize(e.id),x.success(r?"Historia clínica finalizada":"Cambios guardados"),t.close(),C()}catch(o){x.error(o.message||"Error al guardar"),c.disabled=!1,c.textContent=l}}(b=document.getElementById("save-hx-edit-draft"))==null||b.addEventListener("click",()=>a(!1)),(h=document.getElementById("save-hx-edit-finalize"))==null||h.addEventListener("click",()=>a(!0))}function se(e){M(e,`
    <div class="page-header">
      <h1 class="page-title">Historia Clínica</h1>
      <p class="page-subtitle">Gestiona las historias clínicas oftalmológicas</p>
    </div>
    <div class="card">
      <div id="hx-table-container"></div>
    </div>
  `);const t=document.getElementById("hx-table-container");E=new G({container:t,columns:Q,searchPlaceholder:"Buscar historia clínica...",onRowClick:W,onSearch:a=>C(a,1),onPageChange:a=>C(P,a),actions:'<button class="btn btn-primary" id="btn-new-hx">+ Nueva historia</button>'}),E.render({loading:!0}),C(),t.addEventListener("click",a=>{a.target.id==="btn-new-hx"&&U()})}export{se as render};
