# خدعة؟ — Real or Ruse?

**[العربية](#العربية) · [English](#english)**

> لعبة ويب تعليمية لمسابقة Technovation 2026–2027. من تطوير **ديما ماجد المعارك**، مبرمجة سعودية. جميع الحقوق محفوظة (انظر [LICENSE](LICENSE)).

---

## العربية

### وش اللعبة؟
اللاعبة «محقّقة» على جوال محاكى. توصلها رسائل بعضها احتيال وبعضها سليم. بدل ما تخمّن «نصب أو لا»، تتحقق بأدوات داخل اللعبة (فحص المرسل والرابط، موقع الشركة، سجل الطلبات، الاتصال بالرقم الرسمي، المحادثات القديمة)، تجمع الأدلة في دفتر، تربطها لتصل لاستنتاج، تحكم وتثبت ليش، ثم تقرر التصرف الآمن وتشوف نتيجة قرارها.

- **كل شيء داخل المحاكاة:** لا روابط حقيقية، كل النطاقات `.example`، كل الأسماء والأرقام وهمية.
- **عادة واحدة تتكرر:** «لا تتحققين عبر القناة اللي جاتك منها الرسالة».
- **تقيس التعلّم:** اختبار قبل/بعد برسائل جديدة، ومرآة الثقة (Brier score)، بلا أي خادم أو جمع بيانات شخصية.

### التشغيل محليًا
يحتاج Node 22:
```
npm install
npm run dev
```
ثم افتح `http://localhost:5173`. أوضاع خاصة عبر الرابط: `?tester=1` (وضع المختبِر)، `?mode=family&case=case1` (نسخة العائلة المصغّرة)، `?lang=en`.

### الفحص
```
npm run check          # validator للمحتوى + TypeScript + اختبارات الوحدة
npm run test:e2e       # Playwright (أول مرة: npx playwright install chromium)
npm run build          # النسخة النهائية في dist/
```

### كيف المشروع مرتّب؟ (لمن يعرف Python وما يعرف React)
- **React** = طريقة لبناء الواجهة من «مكونات» صغيرة (دوال ترجع HTML). كل ملف `.tsx` في `src/` مكوّن.
- **TypeScript** = JavaScript مع أنواع (مثل type hints في Python). الأنواع كلها في `src/engine/types.ts`.
- **المحتوى بيانات، مو كود:** القضايا في `src/content/cases/` (مثل dict كبير يصف الرسائل والأدلة والقرارات)، والنصوص كلها في `src/i18n/ar.json` و`en.json`. تعديل قضية أو نص لا يحتاج لمس المحرك.
- **المحرك** `src/engine/` دوال نقية (تأخذ حالة وترجع حالة جديدة) مثل ما تكتبين دوال pandas بلا آثار جانبية. هذا اللي تختبره `tests/unit/`.
- **الحالة** `src/store/`: مكان واحد يحفظ أين وصلت اللاعبة (Zustand)، ويُحفظ في `localStorage` تلقائيًا.
- **الجوال** `src/phone/`: الإطار والتطبيقات الوهمية والأوراق السفلية.
- **التحليل** `analysis/analyze.py`: Python (pandas/scipy/matplotlib) يقرأ رموز النتائج التي يرسلها المختبرون.

### الوثائق
`DECISIONS.md` (القرارات المفتوحة) · `docs/design.md` (التصميم) · `docs/brand-check.md` (فحص الأسماء) · `docs/credits.md` (التراخيص).

---

## English

**Real or Ruse?** is an interactive web game that trains people to spot scams by investigating, not guessing. The player receives messages on a simulated phone and uses in-game tools (sender and link inspection, the company's official site, order history, calling the official number, old chats) to collect evidence in a notebook, link it into deductions, prove a verdict, and choose a safe response, then sees the consequence. Everything is simulated: no real links, `.example` domains, fictional names. A built-in pre/post test and a confidence mirror (Brier score) measure learning with no server and no personal data.

Built by **Deema Majid AlMaarik**, a Saudi developer, for Technovation 2026–2027. All rights reserved.

```
npm install && npm run dev      # http://localhost:5173  (?lang=en for the English UI)
npm run check                   # content validator + TypeScript + unit tests
```
