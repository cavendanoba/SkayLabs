function r({icon:e="📭",title:o="Sin resultados",description:i="No hay elementos para mostrar",action:a=null}={}){return`
    <div class="empty-state">
      <div class="empty-state-icon">${e}</div>
      <h3 class="empty-state-title">${o}</h3>
      <p class="empty-state-description">${i}</p>
      ${a?`<div class="empty-state-action">${a}</div>`:""}
    </div>
  `}if(!document.querySelector("#empty-state-styles")){const e=document.createElement("style");e.id="empty-state-styles",e.textContent=`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    .empty-state-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--color-text);
    }
    .empty-state-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin: 0 0 1.5rem 0;
      max-width: 300px;
    }
  `,document.head.appendChild(e)}class d{constructor({id:o,title:i,size:a="md",onClose:t}={}){this.id=o||`modal-${Date.now()}`,this.title=i,this.size=a,this.onClose=t,this._el=null}render(o,i=""){const a=document.getElementById(this.id);a&&a.remove();const t=document.createElement("div");return t.id=this.id,t.className="optix-modal-backdrop",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-label",this.title),t.innerHTML=`
      <div class="optix-modal optix-modal-${this.size}">
        <div class="optix-modal-header">
          <h3 class="optix-modal-title">${this.title}</h3>
          <button class="optix-modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="optix-modal-body">${o}</div>
        ${i?`<div class="optix-modal-footer">${i}</div>`:""}
      </div>
    `,document.body.appendChild(t),this._el=t,requestAnimationFrame(()=>{t.classList.add("active")}),t.addEventListener("click",s=>{s.target===t&&this.close()}),t.querySelector(".optix-modal-close").addEventListener("click",()=>this.close()),this._keyHandler=s=>{s.key==="Escape"&&this.close()},document.addEventListener("keydown",this._keyHandler),t}close(){this._el&&(this._el.classList.remove("active"),setTimeout(()=>{var o;(o=this._el)==null||o.remove(),this._el=null,this.onClose&&this.onClose()},300),document.removeEventListener("keydown",this._keyHandler))}static close(o){const i=document.getElementById(o);i&&(i.classList.remove("active"),setTimeout(()=>i.remove(),300))}getElement(){return this._el}}if(!document.querySelector("#modal-styles")){const e=document.createElement("style");e.id="modal-styles",e.textContent=`
    .optix-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .optix-modal-backdrop.active {
      opacity: 1;
    }
    .optix-modal {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform 0.3s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .optix-modal-backdrop.active .optix-modal {
      transform: scale(1);
    }
    .optix-modal-sm { max-width: 400px; }
    .optix-modal-md { max-width: 600px; }
    .optix-modal-lg { max-width: 800px; }
    .optix-modal-xl { max-width: 1000px; }
    .optix-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .optix-modal-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      margin: 0;
    }
    .optix-modal-close {
      background: none;
      border: none;
      font-size: 1.75rem;
      cursor: pointer;
      color: var(--color-text-muted);
      line-height: 1;
      transition: color 0.2s;
      padding: 0 0.5rem;
    }
    .optix-modal-close:hover { color: var(--color-text); }
    .optix-modal-body { padding: 1.5rem; }
    .optix-modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      background: var(--color-surface-raised);
      border-radius: 0 0 16px 16px;
    }
    @media (max-width: 768px) {
      .optix-modal { max-width: 100% !important; margin: 0; border-radius: 12px; }
    }
  `,document.head.appendChild(e)}export{d as M,r};
