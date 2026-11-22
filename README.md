# Web2App — MVP 0.2

منصة عربية أولية لتحويل موقع HTTPS إلى مشروع Android قابل للبناء كملف APK.

## المكونات
- واجهة عربية متجاوبة في `public/`.
- خادم Express ونقطة API لإنشاء APK في `server.js`.
- قالب Android Gradle كامل في `android-template/`.
- وضعا WebView وCustom Tabs.
- لوحة تحكم أولية تحفظ سجل المشاريع محلياً في المتصفح.

## تشغيل المنصة
المتطلبات: Node.js 20 أو أحدث.

```bash
npm install
npm start
```

افتح `http://localhost:3000`.

لفحص صياغة JavaScript:

```bash
npm run check
```

## متطلبات إنشاء APK
خادم البناء يحتاج إلى:
- JDK 17.
- Android SDK مع Android Platform 35 وBuild Tools.
- Gradle 8.9 أو أحدث على PATH، أو تحديد المسار عبر `GRADLE_BIN`.
- ضبط `ANDROID_HOME` أو `ANDROID_SDK_ROOT`.

يشغّل الخادم `gradle assembleDebug` داخل نسخة مؤقتة من قالب Android. لا يتضمن المستودع Gradle Wrapper حالياً، لذا يجب تثبيت Gradle على خادم البناء.

## تنبيهات قبل الإطلاق
1. APK الناتج Debug-signed للاختبار فقط، وليس إصداراً جاهزاً للنشر التجاري أو Google Play.
2. يلزم إعداد توقيع Release آمن على خادم البناء. لا ترفع keystore أو كلمات مروره إلى GitHub.
3. بعض المواقع تمنع التضمين داخل WebView أو تحتاج تكاملاً خاصاً لتسجيل الدخول والإشعارات والروابط العميقة والملفات.
4. وضع Custom Tabs مناسب أكثر لتسجيل الدخول المعتمد على جلسة المتصفح. WebView وCustom Tabs لا يتشاركان مخزن ملفات تعريف الارتباط.
5. سجل المشاريع محفوظ في متصفح المستخدم فقط. لا توجد حالياً حسابات أو قاعدة بيانات أو اشتراكات أو مدفوعات حقيقية.
6. لا تنشر الخدمة للعامة قبل إضافة المصادقة، وتحديد المعدل والحصص، وطابور مهام، وعزل عمال البناء، ومراقبة الموارد، وسياسة خصوصية وشروط استخدام.
7. لم يتم تأكيد إنشاء APK فعلي في بيئة البناء الحالية؛ يجب تنفيذ اختبار Gradle على خادم مجهز بـJDK وAndroid SDK قبل اعتبار الميزة جاهزة.

## هيكل قالب Android
```
android-template/
  settings.gradle
  build.gradle
  gradle.properties
  app/
    build.gradle
    src/main/AndroidManifest.xml
    src/main/java/com/web2app/template/MainActivity.java
```
