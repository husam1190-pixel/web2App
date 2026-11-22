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

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));

function safePackage(value) {
  const cleaned = String(value || "com.web2app.generated")
    .toLowerCase().replace(/[^a-z0-9.]/g, ".")
    .replace(/\.+/g, ".").replace(/^\.|\.$/g, "");
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){1,5}$/.test(cleaned)) {
    throw new Error("اسم الحزمة غير صالح. استخدم مثلاً com.example.myapp");
  }
  return cleaned;
}
function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function validUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("أدخل رابطاً صحيحاً يبدأ بـ https://"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("يسمح فقط بروابط HTTP وHTTPS.");
  if (u.username || u.password) throw new Error("لا تضع بيانات تسجيل الدخول داخل الرابط.");
  return u.toString();
}
function copyTemplate(src, dst) {
  fs.cpSync(src, dst, { recursive: true });
}
function replaceInFiles(dir, replacements) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) replaceInFiles(full, replacements);
    else {
      let content = fs.readFileSync(full, "utf8");
      for (const [from, to] of Object.entries(replacements)) content = content.split(from).join(to);
      fs.writeFileSync(full, content);
    }
  }
}
function runGradle(projectDir) {
  return new Promise((resolve, reject) => {
    const gradle = process.env.GRADLE_BIN || "gradle";
    execFile(gradle, ["--no-daemon", "assembleDebug"], {
      cwd: projectDir, timeout: 10 * 60 * 1000, maxBuffer: 8 * 1024 * 1024
    }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message).slice(-5000)));
      resolve(stdout);
    });
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Web2App builder API", version: "0.1.0" });
});

app.post("/api/build", async (req, res) => {
  let workDir;
  try {
    const website = validUrl(req.body.url);
    const appName = String(req.body.appName || "").trim();
    if (!appName || appName.length > 35) throw new Error("اسم التطبيق مطلوب (حتى 35 حرفاً).");
    const packageName = safePackage(req.body.packageName);
    const browserMode = String(req.body.browserMode || "WEBVIEW").toUpperCase();
    if (!["WEBVIEW", "CUSTOM_TAB"].includes(browserMode)) {
      throw new Error("وضع التصفح غير صالح.");
    }
    const jobId = crypto.randomBytes(8).toString("hex");
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "web2app-"));
    const projectDir = path.join(workDir, "project");
    copyTemplate(TEMPLATE, projectDir);

    const packagePath = packageName.split(".").join("/");
    const javaRoot = path.join(projectDir, "app/src/main/java");
    const oldJava = path.join(javaRoot, "com/web2app/template");
    const newJava = path.join(javaRoot, packagePath);
    fs.mkdirSync(path.dirname(newJava), { recursive: true });
    fs.renameSync(oldJava, newJava);

    replaceInFiles(projectDir, {
      "__APP_NAME__": xmlEscape(appName),
      "__START_URL__": website.replace(/\\/g, "\\\\").replace(/"/g, '\\"'),
      "__PACKAGE_NAME__": packageName,
      "__JAVA_PACKAGE__": packageName,
      "__BROWSER_MODE__": browserMode,
      "__JOB_ID__": jobId
    });

    await runGradle(projectDir);
    const apk = path.join(projectDir, "app/build/outputs/apk/debug/app-debug.apk");
    if (!fs.existsSync(apk)) throw new Error("اكتمل البناء لكن ملف APK لم يتم العثور عليه.");
    res.download(apk, `${appName.replace(/[^a-zA-Z0-9_-]/g, "_")}.apk`, () => {
      fs.rmSync(workDir, { recursive: true, force: true });
    });
  } catch (e) {
    if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
    res.status(400).json({ error: e.message || "تعذر إنشاء التطبيق." });
  }
});

app.listen(PORT, () => console.log(`Web2App running on port ${PORT}`));
