
# 🛠️ Git Best Practices and Guidelines

Effective use of Git ensures clean, organized repositories and simplifies collaboration. Follow these guidelines to maintain high-quality version control.

## 1. 🌿 Branching Strategy

- Always create a new branch for your changes. Avoid working directly on the `main` or `master` branch.

- Use descriptive names for branches:
  - `Feature: feature/add-login`
  - `Bugfix: bugfix/fix-signup-error`
  - `Hotfix: hotfix/critical-issue`

## 2. 🔍 Commit Messages

Write clear, concise commit messages.

**Follow the format:**

```bash
<type>: <short summary>
<optional detailed description>
```

**Examples**

- `feat: add user authentication module`
- `fix: resolve crash on form submission`
- `docs: update contribution guidelines`

**Types**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

---

### 3. 🧹 Atomic Commits

- Each commit should focus on a single purpose.
- Avoid combining unrelated changes in one commit.

---

### 4. 🔄 Keep Your Branch Up-to-Date

- Regularly sync your branch with the upstream main branch to avoid conflicts.

```bash
git fetch upstream
git merge upstream/main
```

---

### 5. ✅ Code Review Ready

- Before pushing your changes:
  - Run tests to ensure nothing is broken.
  - Check your code for typos and unnecessary changes.

---

### 6. 🚀 Push Regularly

- Push your commits frequently, but only when the branch is in a functional state.

```bash
git push origin branch-name
```

---

### 7. 🕵️ Review Before Pushing

- Check your changes before committing:

```bash
git diff
```

---

### 8. 🌍 Collaborate with Pull Requests (PRs)

- Always open a PR for merging changes.
- Ensure PRs are small, focused, and well-documented.
- Use draft PRs for ongoing work to gather feedback.

---

### 9. 🔄 Resolve Conflicts Carefully

- When conflicts arise, resolve them carefully and test your code before committing the resolution.

---
Following these guidelines ensures a smooth, collaborative Git workflow and keeps the project maintainable! 🚀 If you need help, feel free to ask.