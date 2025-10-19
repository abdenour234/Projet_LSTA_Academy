### Copilot Migration Operating Instructions

#### Purpose

These instructions define **how Copilot must work** when performing the migration, not the tools it uses. The main principle is: every change must be safe, reversible, and traceable using **GitHub branches**.

---

### 1. Workflow Principles

* **Never modify the main branch directly.**
* For every feature, fix, or refactor, Copilot must:

  1. Create a **new branch** with a clear name (e.g., `feat/add-student-entity`, `fix/auth-bug`, `refactor/backend-structure`).
  2. Commit small, incremental changes with descriptive messages.
  3. Push the branch to GitHub.
  4. Open a **Pull Request (PR)** for human review and validation.
  5. Only merge the PR once verified by a human (you or a reviewer).

---

### 2. Validation Rules

Before any merge:

* Copilot must verify that the project builds and tests pass.
* The code should maintain existing functionality.
* Any migration affecting the database must include:

  * A **migration script** (SQL or ORM migration file).
  * A **rollback script** or rollback plan.

---

### 3. Rollback Strategy

If a branch introduces issues:

* Use GitHub’s **branch protection** to prevent forced pushes to main.
* Simply revert the merge commit or delete the branch.
* Optionally, tag the last stable state (`v1.0.0`, `stable-frontend`, etc.) before major updates.

---

### 4. Commit & Review Standards

Each commit message must follow the pattern:

```
<type>(<scope>): <short description>
```

Examples:

* `feat(api): add endpoint for teacher data`
* `fix(ui): correct layout issue on dashboard`
* `refactor(db): rename student table columns`

PR titles should summarize the branch purpose, and the PR description must include:

* What changed
* Why it changed
* Any testing or validation performed

---

### 5. Automation Scope

Copilot can automatically:

* Create feature branches
* Write and commit code to them
* Run local build/test checks
* Push branches and open PRs

Copilot **cannot merge** without human approval.

---

### 6. Human Review Flow

When Copilot opens a PR:

1. Review changes directly on GitHub.
2. Comment or request changes if needed.
3. Approve and merge once validated.
4. Delete branch after merge to keep the repository clean.

---

### 7. Safety Summary

* All work happens in **branches**, never on `main`.
* Every change has **a PR, a diff, and a history**.
* Restoring is always possible by reverting merges or re-checking out a stable tag.

---

**In short:** Copilot works like a careful team member—branching for every task, keeping main safe, and waiting for human approval before final merges.
also don't creat document files unless ur told to