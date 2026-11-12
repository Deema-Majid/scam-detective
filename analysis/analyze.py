"""Analyze tester results for the pre/post test (build-plan section 8).

Reads results from a folder:
  * *.json        one results object per file (docs/results-schema.md)
  * codes.txt     one results code per line ("SD1.<base64url deflate-raw>" or "SD0.<base64url>")

Writes to --out:
  * summary.md          English table for the competition materials
  * pre_post.png        before/after bars with individual points
  * polished_sloppy.png accuracy on polished vs sloppy messages (post test)
  * metrics.csv         one row per tester

Usage:
  python analyze.py --input sample-data --out output
Honesty rule: the script reports whatever the data says. With fewer than 5 paired
testers it writes "insufficient data" instead of a test statistic.
"""
import argparse
import base64
import json
import sys
import zlib
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy import stats  # noqa: E402

MIN_PAIRS = 5
INK = "#3a352b"
SERIES = "#b07d12"
GRID = "#d9d3c6"


def b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def decode_code(code: str) -> dict:
    code = code.strip()
    if not (code.startswith("SD1.") or code.startswith("SD0.")):
        raise ValueError("not a results code")
    raw = b64url_decode(code[4:])
    if code.startswith("SD1."):
        raw = zlib.decompress(raw, -15)  # raw deflate
    return json.loads(raw.decode("utf-8"))


def load_results(folder: Path) -> list[dict]:
    out: list[dict] = []
    for p in sorted(folder.glob("*.json")):
        try:
            out.append(json.loads(p.read_text(encoding="utf-8")))
        except Exception as e:  # noqa: BLE001
            print(f"skip {p.name}: {e}", file=sys.stderr)
    codes = folder / "codes.txt"
    if codes.exists():
        for i, line in enumerate(codes.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                out.append(decode_code(line))
            except Exception as e:  # noqa: BLE001
                print(f"skip codes.txt line {i}: {e}", file=sys.stderr)
    return out


def dedupe_by_tester(results: list[dict]) -> tuple[list[dict], int]:
    """Keep the record with the latest finishedAt per tester code.

    Records without a tester code are never merged. Ties keep the later-read record.
    """
    best: dict[str, int] = {}
    for i, r in enumerate(results):
        t = r.get("tester")
        if not t:
            continue
        key = str(t).strip().upper()
        if key not in best or str(r.get("finishedAt", "")) >= str(results[best[key]].get("finishedAt", "")):
            best[key] = i
    keep = {i for i in best.values()}
    kept = [r for i, r in enumerate(results) if not r.get("tester") or i in keep]
    return kept, len(results) - len(kept)


def metrics(items: list[dict]) -> dict:
    if not items:
        return {}
    df = pd.DataFrame(items)
    pol = df[df["polished"]]
    slo = df[~df["polished"]]
    return {
        "accuracy": df["correct"].mean(),
        "brier": df["brier"].mean(),
        "other_channel": df["otherChannel"].mean(),
        "acc_polished": pol["correct"].mean() if len(pol) else np.nan,
        "acc_sloppy": slo["correct"].mean() if len(slo) else np.nan,
    }


def build_table(results: list[dict]) -> pd.DataFrame:
    rows = []
    for r in results:
        pre = metrics(r.get("pre", {}).get("items", []))
        post = metrics(r.get("post", {}).get("items", []))
        row = {"tester": r.get("tester", "?"), "age": r.get("age", ""), "synthetic": bool(r.get("synthetic", False))}
        for k, v in pre.items():
            row[f"pre_{k}"] = v
        for k, v in post.items():
            row[f"post_{k}"] = v
        rows.append(row)
    return pd.DataFrame(rows)


def paired_test(df: pd.DataFrame, metric: str) -> dict:
    a, b = f"pre_{metric}", f"post_{metric}"
    if a not in df or b not in df:
        return {"n": 0, "pre": np.nan, "post": np.nan, "p": None, "note": "no data"}
    d = df[[a, b]].dropna()
    n = len(d)
    res = {"n": n, "pre": d[a].mean() if n else np.nan, "post": d[b].mean() if n else np.nan, "p": None, "note": ""}
    if n < MIN_PAIRS:
        res["note"] = f"insufficient data (n={n} < {MIN_PAIRS})"
        return res
    diff = d[b] - d[a]
    rng = np.random.default_rng(0)
    boots = [rng.choice(diff.to_numpy(), size=n, replace=True).mean() for _ in range(5000)]
    res["ci"] = (float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5)))
    if n < 6:
        res["note"] = f"n={n}: with fewer than 6 testers an exact Wilcoxon test can never reach p<0.05 (best possible 0.0625); read the confidence interval"
    if (diff == 0).all():
        res["note"] = "no change"
        res["p"] = 1.0
        return res
    res["p"] = float(stats.wilcoxon(d[a], d[b]).pvalue)
    return res


def style_axes(ax):
    ax.set_axisbelow(True)
    ax.grid(axis="y", color=GRID, linewidth=0.6)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(INK)
    ax.tick_params(colors=INK, labelsize=9)


def plot_pre_post(df: pd.DataFrame, out: Path):
    specs = [("accuracy", "Accuracy", (0, 1)), ("brier", "Brier score (lower is better)", (0, 0.6)), ("other_channel", "Chose 'another channel'", (0, 1))]
    fig, axes = plt.subplots(1, 3, figsize=(10, 3.6))
    for ax, (m, title, ylim) in zip(axes, specs):
        a, b = f"pre_{m}", f"post_{m}"
        if a not in df or b not in df:
            ax.set_visible(False)
            continue
        d = df[[a, b]].dropna()
        means = [d[a].mean(), d[b].mean()]
        ax.bar([0, 1], means, width=0.5, color=SERIES, alpha=0.85)
        for _, row in d.iterrows():
            ax.plot([0, 1], [row[a], row[b]], color=INK, alpha=0.35, linewidth=0.8, marker="o", markersize=3)
        for x, v in enumerate(means):
            ax.text(x, v, f"{v:.2f}", ha="center", va="bottom", fontsize=9, color=INK)
        ax.set_xticks([0, 1], ["Before", "After"])
        ax.set_ylim(*ylim)
        ax.set_title(title, fontsize=10, color=INK)
        style_axes(ax)
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)


def plot_polished(df: pd.DataFrame, out: Path):
    cols = [c for c in ("post_acc_polished", "post_acc_sloppy") if c in df]
    if len(cols) < 2:
        return
    d = df[cols].dropna()
    fig, ax = plt.subplots(figsize=(4.4, 3.6))
    means = [d[c].mean() for c in cols]
    ax.bar([0, 1], means, width=0.5, color=SERIES, alpha=0.85)
    for _, row in d.iterrows():
        ax.plot([0, 1], [row[cols[0]], row[cols[1]]], color=INK, alpha=0.35, linewidth=0.8, marker="o", markersize=3)
    for x, v in enumerate(means):
        ax.text(x, v, f"{v:.2f}", ha="center", va="bottom", fontsize=9, color=INK)
    ax.set_xticks([0, 1], ["Polished messages", "Sloppy messages"])
    ax.set_ylim(0, 1)
    ax.set_title("Post-test accuracy: do looks deceive?", fontsize=10, color=INK)
    style_axes(ax)
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)


def fmt_p(r: dict) -> str:
    if r["p"] is None:
        return r["note"]
    return f"{r['p']:.3f}" + (f" ({r['note']})" if r["note"] else "")


def write_summary(df: pd.DataFrame, out: Path, n_total: int, n_synth: int, n_dupes: int = 0):
    lines = ["# Pre/post results summary", ""]
    if n_synth:
        lines += [f"> **{n_synth} of {n_total} records are synthetic sample data, not real testers.** Do not report these numbers.", ""]
    lines += [f"{n_dupes} duplicate records removed.", ""]
    lines += [f"Testers read: **{n_total}**. Testers with both tests complete: **{int(df[['pre_accuracy', 'post_accuracy']].dropna().shape[0]) if {'pre_accuracy', 'post_accuracy'} <= set(df.columns) else 0}**.", ""]
    lines += ["| Metric | n (paired) | Before | After | Change | 95% CI of change (bootstrap) | Wilcoxon signed-rank p |", "|---|---|---|---|---|---|---|"]
    for m, label in [("accuracy", "Accuracy"), ("brier", "Brier score (lower is better)"), ("other_channel", "Chose 'another channel' first"), ("acc_polished", "Accuracy, polished messages"), ("acc_sloppy", "Accuracy, sloppy messages")]:
        r = paired_test(df, m)
        change = r["post"] - r["pre"] if r["n"] else np.nan
        ci = f"[{r['ci'][0]:+.2f}, {r['ci'][1]:+.2f}]" if r.get("ci") else "n/a"
        lines.append(f"| {label} | {r['n']} | {r['pre']:.2f} | {r['post']:.2f} | {change:+.2f} | {ci} | {fmt_p(r)} |")
    lines += [
        "",
        f"A test statistic is reported only with at least {MIN_PAIRS} paired testers. An exact Wilcoxon test needs n >= 6 to be able to reach p < 0.05, so in small rounds rely on the confidence interval and describe the direction, not significance.",
        "Each test has only 6 items, so individual scores move in steps of 0.17; expect wide intervals. If there is no improvement, report it as it is and describe what was changed after the round.",
    ]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input", default="sample-data")
    ap.add_argument("--out", default="output")
    args = ap.parse_args()
    folder, out = Path(args.input), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    results = load_results(folder)
    if not results:
        sys.exit(f"No results found in {folder}")
    results, n_dupes = dedupe_by_tester(results)
    df = build_table(results)
    df.to_csv(out / "metrics.csv", index=False)
    plot_pre_post(df, out / "pre_post.png")
    plot_polished(df, out / "polished_sloppy.png")
    write_summary(df, out / "summary.md", len(results), int(df["synthetic"].sum()), n_dupes)
    print(f"Read {len(results)} results ({n_dupes} duplicate records removed) -> {out}/ (summary.md, pre_post.png, polished_sloppy.png, metrics.csv)")


if __name__ == "__main__":
    main()
