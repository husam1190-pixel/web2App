const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const TEMPLATE = path.join(ROOT, "android-template");
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));

function safePackage(value) {
  const cleaned = String(value || "com.web2app.generated").toLowerCase()
    .replace(/[^a-z0-9.]/g, ".").replace(/\.+/g, ".").replace(/^\.|\.$/g, "");
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){1,5}$/.test(cleaned))
    throw new Error("اسم الحزمة غير صالح. استخدم مثلاً com.example.myapp");
  return cleaned;
}
function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function validUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error("أدخل رابطاً صحيحاً يبدأ بـ https://"); }
  if (url.protocol !== "https:") throw new Error("يجب أن يبدأ رابط الموقع بـ https:// لضمان اتصال آمن.");
  if (url.username || url.password) throw new Error("لا تضع بيانات تسجيل الدخول داخل الرابط.");
  return url.toString();
}
function replaceInFiles(dir, replacements) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) replaceInFiles(full, replacements);
    else {
      let content = fs.readFileSync(full, "utf8"), updated = content;
      for (const [from, to] of Object.entries(replacements)) updated = updated.split(from).join(to);
      if (updated !== content) fs.writeFileSync(full, updated, "utf8");
    }
  }
}
function runGradle(projectDir) {
  return new Promise((resolve, reject) => {
    execFile(process.env.GRADLE_BIN || "gradle", ["--no-daemon", "--stacktrace", "assembleDebug"], {
      cwd: projectDir, timeout: 10 * 60 * 1000, maxBuffer: 8 * 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) return reject(new Error((stderr || stdout || error.message).slice(-5000)));
      resolve(stdout);
    });
  });
}
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "Web2App builder API", version: "0.2.0" }));

app.post("/api/build", async (req, res) => {
  let workDir;
  try {
    if (!fs.existsSync(path.join(TEMPLATE, "app", "build.gradle")))
      throw new Error("قالب Android غير مكتمل على الخادم.");
    const website = validUrl(req.body && req.body.url);
    const appName = String((req.body && req.body.appName) || "").trim();
    if (!appName || appName.length > 35) throw new Error("اسم التطبيق مطلوب (حتى 35 حرفاً).");
    const packageName = safePackage(req.body && req.body.packageName);
    const browserMode = String((req.body && req.body.browserMode) || "WEBVIEW").toUpperCase();
    if (!["WEBVIEW", "CUSTOM_TAB"].includes(browserMode)) throw new Error("وضع التصفح غير صالح.");

    const jobId = crypto.randomBytes(8).toString("hex");
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "web2app-"));
    const projectDir = path.join(workDir, "project");
    fs.cpSync(TEMPLATE, projectDir, { recursive: true });
    const javaRoot = path.join(projectDir, "app", "src", "main", "java");
    const oldJava = path.join(javaRoot, "com", "web2app", "template");
    const newJava = path.join(javaRoot, packageName.split(".").join("/"));
    if (!fs.existsSync(oldJava)) throw new Error("ملف MainActivity غير موجود في قالب Android.");
    if (oldJava !== newJava) {
      fs.mkdirSync(path.dirname(newJava), { recursive: true });
      fs.renameSync(oldJava, newJava);
    }
    replaceInFiles(projectDir, {
      "__APP_NAME__": xmlEscape(appName),
      "__START_URL__": website.replace(/\\/g, "\\\\").replace(/"/g, '\\"'),
      "__PACKAGE_NAME__": packageName,
      "__JAVA_PACKAGE__": packageName,
      "__BROWSER_MODE__": browserMode,
      "__JOB_ID__": jobId
    });
    await runGradle(projectDir);
    const apk = path.join(projectDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
    if (!fs.existsSync(apk)) throw new Error("لم يتم العثور على ملف APK بعد انتهاء Gradle.");
    const filename = (appName.replace(/[^a-zA-Z0-9_-]/g, "_") || "web2app") + ".apk";
    res.download(apk, filename, (error) => {
      if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
      if (error && !res.headersSent) res.status(500).json({ error: "تعذر إرسال ملف APK." });
    });
  } catch (error) {
    if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
    const message = error.message || "تعذر إنشاء التطبيق.";
    const clientError = /رابط|اسم التطبيق|اسم الحزمة|وضع التصفح|https/i.test(message);
    res.status(clientError ? 400 : 500).json({ error: message });
  }
});
app.listen(PORT, () => console.log("Web2App running on port " + PORT));
