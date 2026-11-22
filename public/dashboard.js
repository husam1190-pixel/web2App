const key="web2app_projects_v1";
const projects=JSON.parse(localStorage.getItem(key)||"[]");
document.getElementById("count").textContent=projects.length;
const body=document.getElementById("projects");
if(projects.length){body.innerHTML="";projects.forEach(p=>{const tr=document.createElement("tr");[p.name,p.url,p.date,"مسجل محلياً"].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});body.appendChild(tr)})}
