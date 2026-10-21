import{u as v}from"./users.service-D5hnUTKZ.js";import{D as T}from"./table.component-Di2JxQac.js";import{M as E}from"./modal.component-BvFy3yQw.js";import{r as N,b as w,T as r,c as y}from"./index-CuY4N-rM.js";const x=[{header:"Usuario",key:"name",render:e=>`
      <div class="cell-patient">
        <div class="cell-avatar">${e.name[0]}</div>
        <div>
          <div class="fw-600">${e.name}</div>
          <div class="text-muted text-sm">${e.email}</div>
        </div>
      </div>
    `},{header:"Rol",key:"role",render:e=>y(e.role)},{header:"Especialidad",key:"specialty",render:e=>e.specialty||"—"},{header:"Estado",key:"active",render:e=>y(e.active?"active":"inactive")},{header:"Creado",key:"createdAt",render:e=>new Date(e.createdAt).toLocaleDateString("es-CO")}];let a=null,h=[];async function g(){try{a==null||a.showLoading();const e=await v.list();h=e,a==null||a.render({data:e,total:e.length,page:1,pages:1})}catch{r.error("Error al cargar usuarios")}}function D(){var o,u;const e=new E({title:"Nuevo Usuario",size:"md"});e.render(`
    <form id="user-form" class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Nombre completo *</label>
        <input type="text" name="name" class="form-control" required placeholder="Nombre del usuario" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Email *</label>
        <input type="email" name="email" class="form-control" required placeholder="correo@optix.co" />
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña *</label>
        <input type="password" name="password" class="form-control" required placeholder="Mínimo 8 caracteres" minlength="8" />
      </div>
      <div class="form-group">
        <label class="form-label">Rol *</label>
        <select name="role" class="form-control" required>
          <option value="RECEPTIONIST">Recepcionista</option>
          <option value="DOCTOR">Médico</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Especialidad</label>
        <input type="text" name="specialty" class="form-control" placeholder="Ej: Oftalmología" />
      </div>
      <div class="form-group">
        <label class="form-label">No. de licencia</label>
        <input type="text" name="licenseNumber" class="form-control" placeholder="Ej: OFT-12345" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" placeholder="Teléfono de contacto" />
      </div>
    </form>
  `,`
    <button type="button" class="btn btn-secondary" id="cancel-user">Cancelar</button>
    <button type="submit" form="user-form" class="btn btn-primary" id="save-user">Crear usuario</button>
  `),(o=document.getElementById("cancel-user"))==null||o.addEventListener("click",()=>e.close()),(u=document.getElementById("user-form"))==null||u.addEventListener("submit",async s=>{s.preventDefault();const c=document.getElementById("save-user"),m=new FormData(s.target),l=Object.fromEntries(m.entries());Object.keys(l).forEach(i=>{l[i]||delete l[i]});try{c.disabled=!0,c.textContent="Creando...",await v.create(l),r.success("Usuario creado exitosamente"),e.close(),g()}catch(i){r.error(i.message||"Error al crear el usuario"),c.disabled=!1,c.textContent="Crear usuario"}})}async function L(e){var m,l,i;const t=h.find(d=>d.id===e);if(!t)return;const n=w.getLocalUser();if(t.id===(n==null?void 0:n.id)){r.info("No puedes editar tu propio usuario desde aquí");return}const o=new E({title:"Editar Usuario",size:"md"}),u=`
    <form id="edit-user-form" class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Nombre completo *</label>
        <input type="text" name="name" class="form-control" required value="${t.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Rol *</label>
        <select name="role" class="form-control" required>
          <option value="RECEPTIONIST" ${t.role==="RECEPTIONIST"?"selected":""}>Recepcionista</option>
          <option value="DOCTOR" ${t.role==="DOCTOR"?"selected":""}>Médico</option>
          <option value="ADMIN" ${t.role==="ADMIN"?"selected":""}>Administrador</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Especialidad</label>
        <input type="text" name="specialty" class="form-control" value="${t.specialty||""}" />
      </div>
      <div class="form-group">
        <label class="form-label">No. de licencia</label>
        <input type="text" name="licenseNumber" class="form-control" value="${t.licenseNumber||""}" />
      </div>
    </form>
  `,s=t.active,c=`
    <button type="button" class="btn ${s?"btn-warning":"btn-success"}" id="toggle-user-status">
      ${s?"Desactivar usuario":"Activar usuario"}
    </button>
    <button type="button" class="btn btn-secondary" id="cancel-edit-user">Cancelar</button>
    <button type="submit" form="edit-user-form" class="btn btn-primary" id="save-edit-user">Guardar cambios</button>
  `;o.render(u,c),(m=document.getElementById("cancel-edit-user"))==null||m.addEventListener("click",()=>o.close()),(l=document.getElementById("toggle-user-status"))==null||l.addEventListener("click",async()=>{try{await v.updateStatus(t.id,!s),r.success(`Usuario ${s?"desactivado":"activado"} correctamente`),o.close(),g()}catch(d){r.error(d.message||"Error al cambiar el estado")}}),(i=document.getElementById("edit-user-form"))==null||i.addEventListener("submit",async d=>{d.preventDefault();const p=document.getElementById("save-edit-user"),C=new FormData(d.target),f=Object.fromEntries(C.entries());Object.keys(f).forEach(b=>{f[b]||(f[b]=null)});try{p.disabled=!0,p.textContent="Guardando...",await v.update(t.id,f),r.success("Usuario actualizado exitosamente"),o.close(),g()}catch(b){r.error(b.message||"Error al actualizar el usuario"),p.disabled=!1,p.textContent="Guardar cambios"}})}function B(e){N(e,`
    <div class="page-header">
      <h1 class="page-title">Gestión de Usuarios</h1>
      <p class="page-subtitle">Administra los usuarios del sistema</p>
    </div>
    <div class="card">
      <div id="users-table-container"></div>
    </div>
  `);const t=document.getElementById("users-table-container");a=new T({container:t,columns:x,searchPlaceholder:"Buscar usuarios...",onRowClick:L,actions:'<button class="btn btn-primary" id="btn-new-user">+ Nuevo usuario</button>'}),a.render({loading:!0}),g(),t.addEventListener("click",n=>{n.target.id==="btn-new-user"&&D()})}export{B as render};
