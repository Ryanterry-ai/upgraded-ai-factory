# Code Review Rules

## Required Checks
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console.log statements
- [ ] No TODO comments without ticket references

## Code Quality
- [ ] Components are reusable and composable
- [ ] Functions are pure when possible
- [ ] No duplicate code
- [ ] Proper error handling
- [ ] TypeScript types are specific (no `any`)

## Accessibility
- [ ] ARIA attributes present
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader compatible

## Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Bundle size within budget

## Security
- [ ] Input validation present
- [ ] Output encoding implemented
- [ ] Authentication required where needed
- [ ] Sensitive data not exposed
