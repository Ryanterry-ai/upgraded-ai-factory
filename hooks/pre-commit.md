# Pre-Commit Hook

## Purpose
Run automated checks before code is committed to prevent issues from entering the codebase.

## Checks
1. **Lint**: Run ESLint on staged files
2. **Type Check**: Run TypeScript compiler
3. **Format**: Run Prettier on staged files
4. **Test**: Run related tests

## Configuration
```json
{
  "hooks": {
    "pre-commit": "lint-staged",
    "pre-push": "npm run test"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Bypass (Emergency Only)
```bash
git commit --no-verify -m "emergency: description"
```
