# DEPLOY.md — نشر اللعبة كرابط (GitHub Pages)

> لا يُنشر شيء إلا بموافقتك وبحسابك أنتِ. الخطوات من جهازك (GitHub CLI مثبّت ومسجّل باسم Deema-Majid).

1. **أنشئي المستودع وارفعي الكود** (مرة واحدة، من مجلد المشروع):
   ```
   gh repo create scam-detective --public --source=. --remote=origin --push
   ```
   (لو تبين المستودع خاصًا: `--private`؛ GitHub Pages يعمل مع المستودعات الخاصة في الحسابات المدفوعة فقط، فالعام أسهل.)
2. **فعّلي Pages من GitHub Actions:** في صفحة المستودع → Settings → Pages → Source: **GitHub Actions**. (أو من الطرفية: `gh api -X POST repos/Deema-Majid/scam-detective/pages -f build_type=workflow`.)
3. **انتظري الـ workflow** `.github/workflows/deploy.yml` (يشتغل تلقائيًا مع كل push إلى `main`، ويشغّل الفحص والاختبارات قبل البناء). تابعيه: `gh run watch`.
4. **انسخي الرابط:** `https://deema-majid.github.io/scam-detective/`. روابط الأوضاع:
   - المختبرون: `…/scam-detective/?tester=1`
   - العائلة: `…/scam-detective/?mode=family&case=case1`
   - الإنجليزية (للمحكّمين): `…/scam-detective/?lang=en`
5. **كل تحديث لاحق:** `git push` فقط، والرابط يتحدث خلال دقيقة أو دقيقتين.

**ملاحظات:**
- الـ workflow يمرّر `VITE_BASE=/scam-detective/` حتى تعمل المسارات تحت اسم المستودع. لو غيّرتِ اسم المستودع لا تحتاجين تغيير شيء.
- Netlify/Vercel يعملان أيضًا: ارفعي مجلد `dist/` بعد `npm run build` (بدون `VITE_BASE`).
- بيانات المختبرين (`analysis/data/`) لا تُرفع أبدًا؛ أضيفيها إلى `.gitignore` قبل أول جولة.
