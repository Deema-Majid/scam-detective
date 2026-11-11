# analysis/

Reads the results codes testers send back and compares before/after the game.

```
pip install -r requirements.txt
python analyze.py --input sample-data --out output          # try it on synthetic data
python analyze.py --input data/round-1 --out output/round-1 # real data (data/ is git-ignored)
```
Input: `*.json` files and/or `codes.txt` (one results code per line). Format: `../docs/results-schema.md`.
Outputs: `summary.md` (English table), `pre_post.png`, `polished_sloppy.png`, `metrics.csv`.

`sample-data/` is **synthetic** (made by `make_sample_data.py`, every file has `"synthetic": true`). Never report those numbers.
Run without `-I`: the packages are installed in the user site folder.
