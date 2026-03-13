# Repository Recovery Guide

Use the steps below to restore your local copy of this repository to the last known-good state.

## Target commit

```
46ec8bd  Merge pull request #3 from kirtan-thakkar/backend
```

---

## Option A — reset an existing local clone

If you already have the repository cloned on your machine, run the following commands inside that directory:

```bash
# Make sure you are on the correct branch
git checkout master

# Pull the latest commits from GitHub
git fetch origin

# Hard-reset to the known-good commit
git reset --hard 46ec8bd4dd100116dfcebd815a8232500ff932ac
```

> **Warning:** `git reset --hard` discards all local uncommitted changes permanently.  
> If you want to keep them first, run `git stash` before the reset.

---

## Option B — fresh clone

If you would rather start from scratch:

```bash
# Clone the repository
git clone https://github.com/kirtan-thakkar/Breach-2026.git
cd Breach-2026

# (Optional) pin to the exact commit instead of the latest master
git checkout 46ec8bd4dd100116dfcebd815a8232500ff932ac
```

---

## Verify the recovery

After running either option, confirm you are on the correct commit:

```bash
git log --oneline -1
# Expected output:
# 46ec8bd Merge pull request #3 from kirtan-thakkar/backend
```

---

## After recovery — reinstall dependencies

### Backend (Python)

```bash
cd backend
pip install -r requirements.txt
```

### Frontend (Node.js / Next.js)

```bash
cd frontend
npm install
```
