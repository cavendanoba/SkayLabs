const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CuY4N-rM.js","assets/index-ChEoKWkp.css"])))=>i.map(i=>d[i]);
import{_ as d}from"./index-CuY4N-rM.js";function i(a){var r;a.innerHTML=`
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">403</div>
        <h1 class="error-title">Acceso denegado</h1>
        <p class="error-description">
          No tienes permisos para acceder a esta sección.
          Contacta al administrador si crees que es un error.
        </p>
        <a href="/dashboard" class="btn btn-primary" id="error-back">Volver al dashboard</a>
      </div>
    </div>
  `,(r=document.getElementById("error-back"))==null||r.addEventListener("click",t=>{t.preventDefault(),d(async()=>{const{default:e}=await import("./index-CuY4N-rM.js").then(o=>o.e);return{default:e}},__vite__mapDeps([0,1])).then(({default:e})=>e.navigate("/dashboard"))})}export{i as render};
