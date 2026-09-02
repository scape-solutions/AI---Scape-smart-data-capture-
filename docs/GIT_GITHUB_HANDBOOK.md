# Git & GitHub Team Collaboration Handbook

This handbook defines the official Git and GitHub workflow for developers collaborating on the **Scape Bin-Picker Projects** repository.

---

## 📌 Core Principles & Rules

1. **`main` is sacred and deployable:** The `main` branch (local and remote) must **never** be used for direct feature development or bug fixes.
2. **Feature branches for everything:** Every new feature, enhancement, or bug fix must be developed on its own dedicated branch created from the latest `main`.
3. **Atomic, descriptive commits:** Each commit should represent a single logical task or fix with a clear, informative commit message (e.g. `feat: add in-app mic recording to chat assistant` or `fix: layout overlap on campaign modal`).
4. **Pull Requests (PR) required:** All code entering `main` must go through a GitHub Pull Request.
5. **Periodic synchronization:** Regularly update your local `main` branch to stay in sync with teammate merges.
6. **Rebase prior to merge:** Always rebase your local feature branch on top of updated `main` before submitting/updating your Pull Request to maintain a clean, linear git history.
7. **Mutual code review:** Every Pull Request requires review and approval by at least 1 other team member before merging.
8. **Automated branch protection:** GitHub Branch Protection Rules enforce that no direct pushes to `main` are permitted and PR checks/approvals must pass.
9. **Deployment from `main` only:** Cloud Run deployments (`bash deploy.sh`) must **only** be executed from an updated `main` branch after a PR is approved and merged.

---

## 🚀 Daily Developer Workflow (Step-by-Step)

### Step 1: Start Your Day / Begin a New Task
Always pull the latest code from `main` before starting work:

```bash
# 1. Switch to local main and fetch the latest teammate updates
git checkout main
git pull origin main

# 2. Create and switch to a new descriptive feature branch
git checkout -b feature/your-feature-name
# Examples:
#   git checkout -b feature/audio-mic
#   git checkout -b fix/campaign-layout
#   git checkout -b rune/export-filters
```

---

### Step 2: Develop & Make Atomic Commits
Work on your code, test locally, and commit frequently:

```bash
# Check modified files
git status

# Stage and commit your task
git add .
git commit -m "Add generic Open event code to splash screen"
```

---

### Step 3: Keep Your Feature Branch in Sync (Rebase)
While you are working, your teammate might merge code into `main`. Rebase your branch to include their latest changes seamlessly:

```bash
# 1. Update your local main
git checkout main
git pull origin main

# 2. Switch back to your feature branch and rebase on main
git checkout feature/your-feature-name
git rebase main
```

> **💡 Handling Rebase Conflicts (if any occur):**
> 1. Resolve the conflict in your code editor.
> 2. Stage the resolved files: `git add <file>`
> 3. Continue the rebase: `git rebase --continue`
> 4. *(Never use `git merge main` into your feature branch if aiming for linear history).*

---

### Step 4: Push to GitHub & Open a Pull Request
Push your rebased branch to GitHub:

```bash
# First time pushing the branch:
git push -u origin feature/your-feature-name

# If you previously pushed and then rebased locally:
git push --force-with-lease origin feature/your-feature-name
```

1. Open **GitHub** in your browser.
2. Click **"Compare & pull request"**.
3. Fill in a brief description of what changed and assign your teammate as a **Reviewer**.

---

### Step 5: Review & Merge
1. The teammate reviews the code diff, tests if necessary, and clicks **"Approve"**.
2. Once approved, the author (or reviewer) clicks **"Merge Pull Request"** (or **"Rebase and merge"** / **"Squash and merge"**).
3. Delete the remote feature branch on GitHub after merging.

---

### Step 6: Deploy to Cloud Run
Deploying the live application to Google Cloud Run:

```bash
# 1. Switch back to main
git checkout main
git pull origin main

# 2. Run the deployment script
bash deploy.sh
```

---

## 🔒 Recommended GitHub Branch Protection Setup

To enforce these rules automatically on GitHub:

1. In GitHub, navigate to **Settings** → **Branches**.
2. Click **"Add branch protection rule"** (or edit rule for `main`).
3. Set **Branch name pattern:** `main`.
4. Enable the following settings:
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals:** `1`
     - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require linear history** *(optional, enforces rebase/clean commits)*
   - ✅ **Do not allow bypassing the above settings** *(applies to administrators too)*
5. Click **Save changes**.

---

## 🛠️ Quick Reference Cheat Sheet

| Action | Command |
| :--- | :--- |
| **Get latest `main`** | `git checkout main && git pull origin main` |
| **New branch** | `git checkout -b feature/<name>` |
| **Commit task** | `git add . && git commit -m "<message>"` |
| **Rebase on `main`** | `git checkout main && git pull origin main && git checkout - && git rebase main` |
| **Push branch** | `git push -u origin feature/<name>` |
| **Push after rebase** | `git push --force-with-lease origin feature/<name>` |
| **Deploy** | `git checkout main && git pull origin main && bash deploy.sh` |
