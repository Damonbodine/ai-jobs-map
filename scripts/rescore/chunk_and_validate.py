"""
DG3 scoring harness utilities.

  chunk    — split data/scoring/tasks_to_score.csv into shuffled-but-seeded
             chunk CSVs of N tasks under data/scoring/chunks/
  validate — check every chunk's score file exists, parses, covers exactly its
             ids with in-range values; report chunks needing (re)runs
  merge    — concatenate validated score files into data/scoring/scores_v2.csv
             with rubric/model provenance columns

Usage:
  python3 scripts/rescore/chunk_and_validate.py chunk [--size 250] [--pilot N]
  python3 scripts/rescore/chunk_and_validate.py validate
  python3 scripts/rescore/chunk_and_validate.py merge --model claude-fable-5
"""
import csv
import hashlib
import json
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCORING = os.path.join(ROOT, "data", "scoring")
CHUNKS = os.path.join(SCORING, "chunks")
SCORES = os.path.join(SCORING, "scores")
RUBRIC = os.path.join(SCORING, "rubric-v2.md")

BLOCKERS = {"physical", "interpersonal", "judgment", "data_access", "none"}
CONFIDENCES = {"low", "medium", "high"}


def rubric_hash():
    with open(RUBRIC, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:12]


def load_tasks():
    with open(os.path.join(SCORING, "tasks_to_score.csv"), newline="") as f:
        return list(csv.DictReader(f))


def cmd_chunk(size=250, pilot=None):
    tasks = load_tasks()
    # Seeded shuffle so each chunk mixes occupations/kinds (avoids per-chunk
    # context bias where an agent anchors on one occupation), reproducibly.
    rng = random.Random(42)
    rng.shuffle(tasks)
    if pilot:
        tasks = tasks[:pilot]
    os.makedirs(CHUNKS, exist_ok=True)
    os.makedirs(SCORES, exist_ok=True)
    n = 0
    for i in range(0, len(tasks), size):
        chunk = tasks[i : i + size]
        name = f"chunk_{i // size:03d}.csv"
        with open(os.path.join(CHUNKS, name), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["kind", "id", "occupation_title", "task_text"])
            w.writeheader()
            w.writerows(chunk)
        n += 1
    print(f"Wrote {n} chunks of up to {size} tasks ({len(tasks)} total) to {CHUNKS}")
    print(f"Rubric hash: {rubric_hash()}")


def expected_ids(chunk_path):
    with open(chunk_path, newline="") as f:
        return [(r["kind"], r["id"]) for r in csv.DictReader(f)]


def validate_one(chunk_name):
    """Returns (ok, message)."""
    chunk_path = os.path.join(CHUNKS, chunk_name)
    score_path = os.path.join(SCORES, chunk_name.replace(".csv", ".json"))
    if not os.path.exists(score_path):
        return False, "missing"
    try:
        rows = json.load(open(score_path))
    except json.JSONDecodeError as e:
        return False, f"bad json: {e}"
    exp = expected_ids(chunk_path)
    got = [(str(r.get("kind")), str(r.get("id"))) for r in rows]
    if sorted(got) != sorted((k, str(i)) for k, i in exp):
        missing = set((k, str(i)) for k, i in exp) - set(got)
        extra = set(got) - set((k, str(i)) for k, i in exp)
        return False, f"id mismatch: {len(missing)} missing, {len(extra)} extra"
    for r in rows:
        if not (isinstance(r.get("score"), int) and 0 <= r["score"] <= 100):
            return False, f"bad score in id {r.get('id')}: {r.get('score')}"
        if r.get("blocker") not in BLOCKERS:
            return False, f"bad blocker in id {r.get('id')}: {r.get('blocker')}"
        rs = r.get("recoverable_share")
        if not (isinstance(rs, (int, float)) and 0 <= rs <= 1):
            return False, f"bad recoverable_share in id {r.get('id')}: {rs}"
        if r.get("confidence") not in CONFIDENCES:
            return False, f"bad confidence in id {r.get('id')}: {r.get('confidence')}"
        # Rubric hard rule: physical blocker caps the digitizable slice
        if r["blocker"] == "physical" and r["score"] > 40:
            return False, f"physical blocker with score {r['score']} (id {r['id']}) — review chunk"
    return True, f"ok ({len(rows)} rows)"


def cmd_validate():
    chunks = sorted(os.listdir(CHUNKS)) if os.path.isdir(CHUNKS) else []
    pending, done = [], 0
    for c in chunks:
        if not c.endswith(".csv"):
            continue
        ok, msg = validate_one(c)
        if ok:
            done += 1
        else:
            pending.append((c, msg))
            print(f"NEEDS RUN  {c}: {msg}")
    print(f"\n{done}/{done + len(pending)} chunks validated")
    return 1 if pending else 0


def cmd_merge(model_id):
    chunks = sorted(c for c in os.listdir(CHUNKS) if c.endswith(".csv"))
    h = rubric_hash()
    out = os.path.join(SCORING, "scores_v2.csv")
    n = 0
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["kind", "id", "score", "blocker", "recoverable_share", "confidence", "score_model_id", "rubric_version"])
        for c in chunks:
            ok, msg = validate_one(c)
            if not ok:
                print(f"SKIPPING {c}: {msg}")
                continue
            rows = json.load(open(os.path.join(SCORES, c.replace(".csv", ".json"))))
            for r in rows:
                w.writerow([r["kind"], r["id"], r["score"], r["blocker"], r["recoverable_share"], r["confidence"], model_id, f"v2.0-{h}"])
                n += 1
    print(f"Merged {n} scores to {out}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "validate"
    if cmd == "chunk":
        size = int(sys.argv[sys.argv.index("--size") + 1]) if "--size" in sys.argv else 250
        pilot = int(sys.argv[sys.argv.index("--pilot") + 1]) if "--pilot" in sys.argv else None
        cmd_chunk(size, pilot)
    elif cmd == "validate":
        sys.exit(cmd_validate())
    elif cmd == "merge":
        model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "claude-fable-5"
        cmd_merge(model)
    else:
        print(__doc__)
        sys.exit(2)
