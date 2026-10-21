import{r as h}from"./modal.component-BvFy3yQw.js";import{d as l}from"./index-CuY4N-rM.js";class b{constructor({container:t,columns:r,onRowClick:e,onSearch:a,onPageChange:n,searchPlaceholder:i="Buscar...",actions:o="",exportable:s=!1,exportFilename:c="exportacion"}={}){this.container=t,this.columns=r,this.onRowClick=e,this.onSearch=a,this.onPageChange=n,this.searchPlaceholder=i,this.actions=o,this.exportable=s,this.exportFilename=c,this.searchTimeout=null,this._lastData=[]}render({data:t=[],total:r=0,page:e=1,pages:a=1,loading:n=!1}={}){this._lastData=t;const i=this.exportable?`<button class="btn btn-secondary btn-sm" id="dt-export-${this._id}" title="Exportar CSV">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
           CSV
         </button>`:"";this.container.innerHTML=`
      <div class="dt-toolbar">
        <div class="dt-search">
          <input
            type="text"
            class="dt-search-input"
            placeholder="${this.searchPlaceholder}"
            id="dt-search-${this._id}"
          />
        </div>
        <div class="dt-actions">${i}${this.actions}</div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${this.columns.map(o=>`<th>${o.header}</th>`).join("")}
            </tr>
          </thead>
          <tbody id="dt-body-${this._id}">
            ${n?l(5,"row"):this._renderRows(t)}
          </tbody>
        </table>
      </div>

      ${this._renderPagination(e,a,r)}
    `,this._attachEvents()}_renderRows(t){return t.length?t.map(r=>`
      <tr class="dt-row" data-id="${r.id||""}">
        ${this.columns.map(e=>`<td>${e.render?e.render(r):r[e.key]??"—"}</td>`).join("")}
      </tr>
    `).join(""):`<tr><td colspan="${this.columns.length}">${h({icon:"📭",title:"Sin resultados",description:"No hay registros que coincidan"})}</td></tr>`}_renderPagination(t,r,e){if(r<=1)return`<div class="dt-footer"><span class="dt-count">${e} registro${e!==1?"s":""}</span></div>`;const a=Math.max(1,t-2),n=Math.min(r,t+2),i=[];for(let o=a;o<=n;o++)i.push(`
        <button class="dt-page-btn ${o===t?"active":""}" data-page="${o}">${o}</button>
      `);return`
      <div class="dt-footer">
        <span class="dt-count">${e} registro${e!==1?"s":""}</span>
        <div class="dt-pagination">
          <button class="dt-page-btn" data-page="${t-1}" ${t<=1?"disabled":""}>‹</button>
          ${i.join("")}
          <button class="dt-page-btn" data-page="${t+1}" ${t>=r?"disabled":""}>›</button>
        </div>
      </div>
    `}_exportCSV(){if(!this._lastData.length)return;const t=this.columns.map(o=>`"${o.header}"`).join(","),r=this._lastData.map(o=>this.columns.map(s=>{let c=s.csvValue?s.csvValue(o):s.render?String(s.render(o)).replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim():o[s.key]??"";return`"${String(c).replace(/"/g,'""')}"`}).join(",")),e=[t,...r].join(`
`),a=new Blob(["\uFEFF"+e],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(a),i=document.createElement("a");i.href=n,i.download=`${this.exportFilename}-${new Date().toISOString().slice(0,10)}.csv`,i.click(),URL.revokeObjectURL(n)}_attachEvents(){const t=this.container.querySelector(`#dt-export-${this._id}`);t&&t.addEventListener("click",()=>this._exportCSV());const r=this.container.querySelector(`#dt-search-${this._id}`);r&&this.onSearch&&r.addEventListener("input",e=>{clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(()=>{this.onSearch(e.target.value)},350)}),this.container.querySelectorAll(".dt-row").forEach(e=>{this.onRowClick&&e.addEventListener("click",()=>this.onRowClick(e.dataset.id))}),this.container.querySelectorAll(".dt-page-btn").forEach(e=>{!e.disabled&&this.onPageChange&&e.addEventListener("click",()=>{const a=parseInt(e.dataset.page);a>0&&this.onPageChange(a)})})}get _id(){return this.__id||(this.__id=Date.now()),this.__id}showLoading(){const t=this.container.querySelector(`#dt-body-${this._id}`);t&&(t.innerHTML=l(5,"row"))}updateRows(t,r,e,a){this._lastData=t;const n=this.container.querySelector(`#dt-body-${this._id}`);n&&(n.innerHTML=this._renderRows(t));const i=this.container.querySelector(".dt-footer");i&&(i.outerHTML=this._renderPagination(e,a,r)),this._attachEvents()}}if(!document.querySelector("#table-styles")){const d=document.createElement("style");d.id="table-styles",d.textContent=`
    .dt-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .dt-search-input {
      padding: 0.6rem 1rem;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      font-family: var(--font-family);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      min-width: 260px;
      transition: border-color 0.2s;
    }
    .dt-search-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }
    .dt-actions { display: flex; gap: 0.5rem; }
    .dt-row { cursor: pointer; }
    .dt-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .dt-count { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .dt-pagination { display: flex; gap: 0.25rem; }
    .dt-page-btn {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      border-radius: 6px;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: var(--font-size-sm);
      transition: all 0.2s;
    }
    .dt-page-btn:hover:not(:disabled) { background: var(--color-accent); color: var(--color-bg-dark); }
    .dt-page-btn.active { background: var(--color-accent); color: var(--color-bg-dark); font-weight: 700; }
    .dt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    @media (max-width: 768px) {
      .dt-toolbar { flex-direction: column; align-items: stretch; }
      .dt-search-input { min-width: auto; width: 100%; }
      .dt-footer { flex-direction: column; gap: 0.75rem; text-align: center; }
    }
  `,document.head.appendChild(d)}export{b as D};
