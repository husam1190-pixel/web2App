const form = document.getElementById("buildForm");
const button = document.getElementById("submit");
const statusBox = document.getElementById("status");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  const key="web2app_projects_v1";
  const saved=JSON.parse(localStorage.getItem(key)||"[]");
  saved.unshift({name:payload.appName,url:payload.url,date:new Date().toLocaleDateString()});
  localStorage.setItem(key,JSON.stringify(saved.slice(0,50)));
  button.disabled = true;
  button.querySelector("span").textContent = "جارٍ تجهيز التطبيق...";
  statusBox.textContent = "يتم بناء ملف APK. قد تستغرق العملية عدة دقائق.";
  try {
    const response = await fetch("/api/build", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok) {
      const data = type.includes("application/json") ? await response.json() : {error:"حدث خطأ أثناء البناء."};
      throw new Error(data.error || "تعذر إنشاء التطبيق.");
    }
    const blob = await response.blob(), url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url;
    a.download=(payload.appName||"web2app")+".apk";
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    statusBox.textContent = "اكتمل البناء. بدأ تنزيل ملف APK.";
  } catch (error) {
    statusBox.textContent = "لم يكتمل البناء: " + error.message;
  } finally {
    button.disabled = false;button.querySelector("span").textContent = "إنشاء ملف APK";
  }
});
