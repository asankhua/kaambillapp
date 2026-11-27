"""Deploy KaamBill to a Hugging Face Space (Docker SDK).

Run by .github/workflows/deploy-hf-space.yml. Environment:
  HF_TOKEN        write token for the Space owner (GitHub secret, required)
  HF_SPACE_ID     e.g. ashishsankhua/kaambill (default below)
  GROQ_API_KEY, SARVAM_API_KEY   copied to the Space as *secrets* when set (GitHub secrets)
  VOICE_PROVIDER  copied to the Space as a variable (groq | sarvam)
  GITHUB_SHA      shown in the commit message

What it does: stages the tracked files (minus tests, design exports and eval data), puts the
Spaces front matter on top of README.md, syncs the Space's secrets/variables, then uploads the
stage in ONE commit (adds, changes and deletions), so the Space rebuilds from the Dockerfile.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from huggingface_hub import CommitOperationAdd, CommitOperationDelete, HfApi

ROOT = Path(__file__).resolve().parents[2]
SPACE_ID = os.environ.get("HF_SPACE_ID") or "ashishsankhua/kaambill"

FRONT_MATTER = """---
title: KaamBill
emoji: 🎙️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Voice billing for Indian tradespeople (Hinglish, Hindi, English)
---

"""

# Not needed to build or run the container (keeps the Space repo small).
EXCLUDE_PREFIXES = (
    ".github/",
    ".husky/",
    "stitch_kaambill_voice_invoicing_app/",
    "untitled folder/",
    "test-results/",
    "phase-1-ui-ux-design/design/",
    "phase-6-quality-demo/eval/",
)
EXCLUDE_PARTS = ("/e2e/", "/ui-parity/")
# ...except what the app imports at build time (the Home screen illustration).
KEEP = ("phase-1-ui-ux-design/design/worker_toolbox_illustration/screen.png",)


def tracked_files() -> list[str]:
    out = subprocess.run(
        ["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True
    ).stdout.decode()
    files = []
    for f in filter(None, out.split("\0")):
        p = ROOT / f
        if not p.is_file() or p.is_symlink():  # LICENSE is a symlink to app/public/LICENSE.txt
            continue
        excluded = f.startswith(EXCLUDE_PREFIXES) or any(part in f"/{f}" for part in EXCLUDE_PARTS)
        if excluded and f not in KEEP:
            continue
        files.append(f)
    return files


def main() -> int:
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("::warning::HF_TOKEN is not set in this repository's secrets; skipping the deploy.")
        return 0

    api = HfApi(token=token)
    who = api.whoami()["name"]
    print(f"Authenticated to Hugging Face as {who}; deploying to space {SPACE_ID}")
    api.create_repo(SPACE_ID, repo_type="space", space_sdk="docker", exist_ok=True)

    # 1. Stage the files.
    stage = Path(tempfile.mkdtemp(prefix="space-"))
    files = tracked_files()
    for f in files:
        dest = stage / f
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, dest)
    # The Space reads its settings from README.md front matter.
    readme = stage / "README.md"
    readme.write_text(FRONT_MATTER + readme.read_text(encoding="utf-8"), encoding="utf-8")
    # The Space is built from the Dockerfile + the files above; the license is shipped as a file too.
    for must in ("Dockerfile", "package-lock.json", "app/public/LICENSE.txt"):
        if not (stage / must).is_file():
            print(f"::error::{must} is missing from the deploy stage")
            return 1
    print(f"Staged {len(files)} files")

    # 2. Space secrets and variables (set before the upload so the new build already has them).
    for name in ("GROQ_API_KEY", "SARVAM_API_KEY"):
        value = os.environ.get(name, "").strip()
        if value:
            api.add_space_secret(SPACE_ID, name, value)
            print(f"Space secret set: {name}")
        else:
            print(f"::warning::{name} not provided; the Space keeps whatever it already has")
    voice = os.environ.get("VOICE_PROVIDER", "").strip()
    if voice:
        api.add_space_variable(SPACE_ID, "VOICE_PROVIDER", voice)
        print(f"Space variable set: VOICE_PROVIDER={voice}")

    # 3. One commit: add/replace every staged file, delete what no longer exists.
    staged = {p.relative_to(stage).as_posix() for p in stage.rglob("*") if p.is_file()}
    remote = set(api.list_repo_files(SPACE_ID, repo_type="space"))
    keep = {".gitattributes"}
    operations: list = [
        CommitOperationAdd(path_in_repo=f, path_or_fileobj=str(stage / f)) for f in sorted(staged)
    ]
    operations += [CommitOperationDelete(path_in_repo=f) for f in sorted(remote - staged - keep)]
    sha = os.environ.get("GITHUB_SHA", "local")[:7]
    commit = api.create_commit(
        SPACE_ID,
        repo_type="space",
        operations=operations,
        commit_message=f"Deploy from GitHub {sha}",
    )
    print(f"Pushed: {commit.commit_url}")
    print(f"Space: https://huggingface.co/spaces/{SPACE_ID}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
