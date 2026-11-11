# رمز النتائج (results code) — المخطط

في نهاية جلسة المختبِر تولّد اللعبة رمزًا نصيًا قصيرًا يرسله المختبِر لديما (واتساب أو غيره) بلا أي خادم. `analysis/analyze.py` يقرأ الرموز من ملف نصي (رمز في كل سطر) أو ملفات JSON.

## الترميز
- `SD1.<base64url>`: JSON مضغوط بـ deflate-raw (`CompressionStream('deflate-raw')` في المتصفح، `zlib.decompress(data, -15)` في Python).
- `SD0.<base64url>`: JSON بلا ضغط (احتياط عندما لا يدعم المتصفح الضغط).
- زر «تنزيل ملف» يحفظ JSON الخام نفسه باسم `results-<code>.json`.

## JSON (الإصدار 1)
```json
{
  "v": 1,
  "tester": "T-0427",
  "age": "16-18",
  "lang": "ar",
  "gender": "f",
  "startedAt": 1794300000000,
  "finishedAt": 1794301500000,
  "pre":  { "form": "A", "items": [ { "id": "A1", "truth": "scam", "polished": true, "verdict": "scam", "confidence": 0.8, "correct": true, "brier": 0.04, "firstAction": "A1.act3", "otherChannel": true } ] },
  "post": { "form": "B", "items": [ "…6 items…" ] },
  "cases": [
    {
      "id": "case1", "truth": "scam", "verdict": "scam", "correct": true, "proven": true, "outcome": "full",
      "confidence": 0.9, "brier": 0.01, "proof": ["D1"],
      "evidenceCollected": ["E1","E2","E3","E4"], "deductions": ["D1"], "toolsUsed": ["sender","link","orders"],
      "openedLinks": ["L1"], "interruptFired": true,
      "decision": { "id": "official-app-report", "rating": "best", "usesOtherChannel": true },
      "durationSec": 412
    }
  ],
  "summary": { "otherChannelCount": 1, "brierCases": 0.01 },
  "feedback": { "open": ["…", "…", "…"], "likert": [4, 5, 3, 4, 5] }
}
```
- `confidence` بين 0.5 و1. `brier = (confidence − correct)²`.
- لا اسم ولا بريد ولا أي معرّف شخصي. `tester` كود مجهول يوزّعه فريق المشروع.
- الحقول `pre`/`post`/`feedback` غائبة في الوضع العادي (غير المختبِر).
