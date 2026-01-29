# Contributing to Kiro

Thank you for your interest in contributing to **Kiro**! We welcome contributions from everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

**Please:**

- Be respectful and constructive in discussions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards others

---

## How to Contribute

There are many ways to contribute:

1. **Report Bugs**: Open an issue describing the bug with steps to reproduce
2. **Suggest Features**: Open an issue with your feature proposal
3. **Improve Documentation**: Fix typos, clarify instructions, add examples
4. **Submit Code**: Fix bugs or implement features via pull requests

---

## Development Setup

### Prerequisites

- Node.js (v18+)
- npm
- Git

### Setup Steps

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/kiro.git
   cd kiro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

---

## Coding Standards

### TypeScript/React

- Use **TypeScript** for all new code
- Follow existing code style (we use ESLint)
- Prefer **functional components** with hooks
- Use **meaningful variable names**

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Follow the existing theme system (CSS variables)
- Ensure responsive design (mobile-first)

### Testing

- Write **unit tests** for new utilities and functions
- Add **integration tests** for complex features
- Ensure all tests pass before submitting:
  ```bash
  npm test
  ```

### Accessibility

- Follow **WCAG AA** guidelines
- Add **ARIA labels** where appropriate
- Ensure **keyboard navigation** works
- Test with screen readers when possible

---

## Commit Message Guidelines

We follow the **Conventional Commits** specification:

```
<type>(<scope>): <short description>

<optional body>

<optional footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(ai): add Ollama integration for local LLM
fix(timeline): correct date sorting in git logs
docs(readme): update installation instructions
style(theme): improve dark mode contrast
```

---

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feat/my-awesome-feature
   ```

2. **Make your changes**
   - Follow coding standards
   - Write tests
   - Update documentation if needed

3. **Commit your changes**

   ```bash
   git commit -m "feat: add awesome feature"
   ```

4. **Push to your fork**

   ```bash
   git push origin feat/my-awesome-feature
   ```

5. **Open a Pull Request**
   - Provide a clear title and description
   - Reference related issues (e.g., "Closes #123")
   - Request review from maintainers

6. **Address review feedback**
   - Make requested changes
   - Push updates to the same branch

7. **Merge**
   - Once approved, a maintainer will merge your PR
   - Your contribution will be included in the next release!

---

## Questions?

If you have questions or need help:

- Open a [GitHub Discussion](https://github.com/yourorg/kiro/discussions)
- Reach out in our community chat
- Email us at [contact@example.com](mailto:contact@example.com)

---

Thank you for contributing to Kiro! 🚀
