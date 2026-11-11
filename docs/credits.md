# الإشادات والتراخيص (credits)

كود اللعبة ومحتواها (القضايا، النصوص، التصميم، المحرك) ملك لديما ماجد المعارك، «جميع الحقوق محفوظة» (انظر `LICENSE`). المكتبات والخطوط أدناه تبقى بتراخيصها الأصلية، وهي لا تفرض فتح مصدر كودنا. جرى التحقق من صفحات الترخيص في 2026-11-10 (ملخص لا رأي قانوني).

| الأداة | الاستخدام عندنا | الترخيص | المصدر |
|---|---|---|---|
| React, React DOM | واجهة اللعبة | MIT | npm |
| Vite, @vitejs/plugin-react | البناء | MIT | npm |
| Tailwind CSS 4 | التنسيق | MIT | npm |
| Zustand | الحالة والحفظ المحلي | MIT | npm |
| GSAP 3 (+ Flip, @gsap/react) | الحركة | ترخيص Webflow/GSAP الموحّد: مجاني للجميع بما فيه التجاري منذ 30 أبريل 2025، ويشمل كل الإضافات | https://gsap.com/licensing/ |
| Lenis | التمرير الناعم خارج الجوال | MIT (© darkroom.engineering) | https://github.com/darkroomengineering/lenis/blob/main/LICENSE |
| IBM Plex Sans Arabic | خط الواجهة (self-hosted) | SIL OFL 1.1 (© IBM؛ الاسم المحجوز «Plex») | https://github.com/IBM/plex/blob/master/LICENSE.txt |
| @fontsource/ibm-plex-sans-arabic | حزمة الخط | الحزمة MIT، الخط يبقى OFL | https://github.com/fontsource/fontsource/blob/main/LICENSE |
| Vitest, Playwright, @axe-core/playwright | الاختبار (لا تُشحن للمستخدم) | MIT / Apache-2.0 / MPL-2.0 | npm |
| pandas, scipy, matplotlib | التحليل (Python، خارج اللعبة) | BSD | PyPI |

## React Bits و21st.dev
- **React Bits** (reactbits.dev): MIT + Commons Clause v1.0 (© David Haz). الاستخدام داخل تطبيق مسموح؛ ممنوع بيع المكونات نفسها أو تقديمها كخدمة. https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
- **21st.dev**: لا ترخيص موحّد؛ لكل مكوّن ترخيص مؤلفه (أغلبها MIT) ويجب التحقق من صفحة كل مكوّن. https://21st.dev/terms
- **ما فعلناه:** لم نُركّب حزمًا من أي منهما. المكونات المتحركة (الخلفية حول الجوال، النص المتحرك، الأزرار) كُتبت داخل المشروع بأسلوب مستوحى منهما وبـ GSAP/CSS فقط. إن نُسخ لاحقًا أي مكوّن حرفيًا، يُسجَّل هنا: الاسم، المؤلف، الرابط، الترخيص، مع إبقاء إشعار الحقوق في الملف.

## أيقونات
أيقونات التطبيقات الوهمية في الجوال مرسومة يدويًا كـ SVG داخل `src/phone/HomeScreen.tsx`. لا شعارات ولا هوية بصرية لشركات حقيقية.
