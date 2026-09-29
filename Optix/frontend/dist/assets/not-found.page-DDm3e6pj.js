const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CuY4N-rM.js","assets/index-ChEoKWkp.css"])))=>i.map(i=>d[i]);
import{_ as d}from"./index-CuY4N-rM.js";function i(a){var e;a.innerHTML=`
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Página no encontrada</h1>
        <p class="error-description">
          La página que buscas no existe o fue movida a otra dirección.
        </p>
        <a href="/dashboard" class="btn btn-primary" id="error-back">Ir al dashboard</a>
      </div>
    </div>
  `,(e=document.getElementById("error-back"))==null||e.addEventListener("click",t=>{t.preventDefault(),d(async()=>{const{default:r}=await import("./index-CuY4N-rM.js").then(o=>o.e);return{default:r}},__vite__mapDeps([0,1])).then(({default:r})=>r.navigate("/dashboard"))})}export{i as render};
