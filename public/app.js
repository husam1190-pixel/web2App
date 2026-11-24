const translations = {
  ar: {
    navHow:"كيف يعمل",navFeatures:"المميزات",navBuilder:"إنشاء تطبيق",
    eyebrow:"من موقعك إلى تطبيق Android",headline:"موقعك الإلكتروني،<br><span>تطبيقك الخاص.</span>",
    subhead:"حوّل موقعك المتوافق مع HTTPS إلى تطبيق Android قابل للتثبيت، بخطوات بسيطة ومن دون البدء من الصفر.",
    heroCta:"ابدأ بتحويل موقعك",betaNote:"نسخة تجريبية — إنشاء APK يحتاج إلى خادم بناء مجهّز.",
    howEyebrow:"ثلاث خطوات بسيطة",howTitle:"من الرابط إلى التطبيق",
    step1Title:"أدخل رابط موقعك",step1Text:"استخدم رابط HTTPS لموقعك الحالي.",
    step2Title:"خصّص التطبيق",step2Text:"اختر الاسم ومعرّف الحزمة وطريقة العرض.",
    step3Title:"أنشئ ملف APK",step3Text:"نزّل نسخة Android التجريبية بعد اكتمال البناء.",
    featuresEyebrow:"مصمم للأفراد والشركات",featuresTitle:"ابدأ من موقعك الحالي",
    feature1Title:"بدون إعادة بناء الموقع",feature1Text:"استخدم موقعك الحالي كنقطة بداية لتطبيق Android.",
    feature2Title:"خيارات عرض مرنة",feature2Text:"اختر WebView أو Custom Tabs حسب احتياج موقعك.",
    feature3Title:"واجهة بلغتين",feature3Text:"واجهة عربية وإنجليزية للعملاء من مختلف البلدان.",
    formTitle:"أنشئ تطبيقك",formIntro:"أدخل بيانات موقعك للبدء",urlLabel:"رابط الموقع الإلكتروني",
    appNameLabel:"اسم التطبيق",modeLabel:"طريقة فتح الموقع داخل التطبيق",
    webviewOption:"WebView — تجربة داخل التطبيق",tabsOption:"Custom Tabs — جلسة المتصفح",
    modeHelp:"قد تحتاج بعض المواقع إلى إعدادات خاصة لتسجيل الدخول أو عرض المحتوى داخل التطبيق.",
    packageLabel:"معرّف التطبيق (Package ID)",packageHelp:"استخدم حروفاً إنجليزية صغيرة ونقاطاً، مثل com.company.store",
    submit:"إنشاء ملف APK",disclaimer:"مهم: هذه نسخة تجريبية. ملفات APK الناتجة حالياً مخصصة للاختبار وليست جاهزة للنشر التجاري أو Google Play.",
    footer:"نسخة تجريبية",working:"جارٍ تجهيز التطبيق...",building:"يتم بناء ملف APK. قد تستغرق العملية عدة دقائق.",
    success:"اكتمل البناء. بدأ تنزيل ملف APK.",failed:"لم يكتمل البناء: "
  },
  en: {
    navHow:"How it works",navFeatures:"Features",navBuilder:"Build an app",
    eyebrow:"From your website to Android",headline:"Your website,<br><span>your Android app.</span>",
    subhead:"Turn your HTTPS website into an installable Android app in a few simple steps—without rebuilding from scratch.",
    heroCta:"Convert your website",betaNote:"Beta version — APK generation requires a configured build server.",
    howEyebrow:"Three simple steps",howTitle:"From URL to app",
    step1Title:"Enter your website URL",step1Text:"Use the HTTPS address of your existing website.",
    step2Title:"Customize your app",step2Text:"Choose an app name, package ID and display mode.",
    step3Title:"Build your APK",step3Text:"Download the test Android package when the build completes.",
    featuresEyebrow:"For individuals and businesses",featuresTitle:"Start with the website you already have",
    feature1Title:"No website rebuild",feature1Text:"Use your existing website as the starting point for an Android app.",
    feature2Title:"Flexible display modes",feature2Text:"Choose WebView or Custom Tabs to suit your website.",
    feature3Title:"Bilingual interface",feature3Text:"Arabic and English interface for customers around the world.",
    formTitle:"Build your app",formIntro:"Enter your website details to get started",urlLabel:"Website URL",
    appNameLabel:"App name",modeLabel:"How should the website open?",
    webviewOption:"WebView — in-app experience",tabsOption:"Custom Tabs — browser session",
    modeHelp:"Some websites may need extra configuration for sign-in or embedded content.",
    packageLabel:"Application ID (Package ID)",packageHelp:"Use lowercase English letters and dots, e.g. com.company.store",
    submit:"Generate APK",disclaimer:"Important: This is a beta. APK files currently target testing and are not ready for commercial release or Google Play.",
    footer:"Beta version",working:"Preparing your app...",building:"Building your APK. This may take several minutes.",
    success:"Build complete. Your APK download has started.",failed:"Build failed: "
  }
};
let currentLanguage = localStorage.getItem("web2app_language") || "ar";
function applyLanguage(language) {
  currentLanguage = language;
  const t = translations[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (t[key]) element.innerHTML = t[key];
  });
  document.getElementById("languageToggle").textContent = language === "ar" ? "English" : "العربية";
  document.getElementById("url").placeholder = "https://www.example.com";
  document.getElementById("appName").placeholder = language === "ar" ? "مثال: متجري" : "e.g. My Store";
  localStorage.setItem("web2app_language", language);
}
document.getElementById("languageToggle").addEventListener("click", () => {
  applyLanguage(currentLanguage === "ar" ? "en" : "ar");
});
applyLanguage(currentLanguage);

const form = document.getElementById("buildForm");
const button = document.getElementById("submit");
const statusBox = document.getElementById("status");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  button.disabled = true;
  button.querySelector("span").textContent = translations[currentLanguage].working;
  statusBox.textContent = translations[currentLanguage].building;
  try {
    const response = await fetch("/api/build", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok) {
      const data = type.includes("application/json") ? await response.json() : {error:"Build failed."};
      throw new Error(data.error || "Unable to generate the app.");
    }
    const blob = await response.blob(), url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url;
    a.download=(payload.appName||"web2app")+".apk";
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    statusBox.textContent = translations[currentLanguage].success;
  } catch (error) {
    statusBox.textContent = translations[currentLanguage].failed + error.message;
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = translations[currentLanguage].submit;
  }
});