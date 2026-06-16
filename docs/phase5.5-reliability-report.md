# Phase 5.5 Reliability Report

**Date:** 16/6/2026
**Version:** v0.5.5-reliability
**Projects Tested:** 140
**Samples Per Factory:** Build-tested 2 projects per factory

---

## Executive Summary

| Metric | Value | Target |
|--------|-------|--------|
| Generation Rate | 100% (140/140) | 100% |
| Build Success Rate | 100% (14/14) | ≥95% |
| Typecheck Success | 100% (14/14) | ≥95% |
| Lint Success | 100% (14/14) | ≥95% |
| Validation Pass Rate | 100% (14/14) | ≥95% |

---

## Results by Factory

| Factory | Generated | Tested | Built | Passed | Status |
|---------|-----------|--------|-------|--------|--------|
| website | 20 | 2 | 2/2 | 2/2 | ✅ |
| ecommerce | 20 | 2 | 2/2 | 2/2 | ✅ |
| saas | 20 | 2 | 2/2 | 2/2 | ✅ |
| admin | 20 | 2 | 2/2 | 2/2 | ✅ |
| dashboard | 20 | 2 | 2/2 | 2/2 | ✅ |
| agent | 20 | 2 | 2/2 | 2/2 | ✅ |
| tools | 20 | 2 | 2/2 | 2/2 | ✅ |

---

## Detailed Results

### website/w01

- **Prompt:** Landing page for a mobile app with hero, features, and download button
- **Generated:** ✅ (16 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (118959ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### website/w11

- **Prompt:** Real estate website with property listings, search, and agent profiles
- **Generated:** ✅ (16 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (109890ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### ecommerce/e01

- **Prompt:** Online store for handmade candles with product grid and cart
- **Generated:** ✅ (24 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (110560ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### ecommerce/e11

- **Prompt:** Electronics store with product comparison, specs, and cart
- **Generated:** ✅ (24 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (114350ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### saas/s01

- **Prompt:** Project management tool with login, dashboard, and settings
- **Generated:** ✅ (23 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (110483ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### saas/s11

- **Prompt:** Note taking app with notebooks, tags, and full-text search
- **Generated:** ✅ (23 files)
- **Pre-repair findings:** 0 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 0 (0 critical)
- **Build:** ✅ (114142ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### admin/a01

- **Prompt:** Admin panel with user table, search, and CRUD operations
- **Generated:** ✅ (17 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (119969ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### admin/a11

- **Prompt:** Role-based admin with permissions, users, and audit log
- **Generated:** ✅ (17 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (110860ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### dashboard/d01

- **Prompt:** Sales dashboard with revenue chart, top products, and recent orders
- **Generated:** ✅ (18 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (119173ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### dashboard/d11

- **Prompt:** Finance dashboard with profit loss, cash flow, and budget tracking
- **Generated:** ✅ (18 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (114763ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### agent/g01

- **Prompt:** Customer support chatbot with FAQ responses and ticket creation
- **Generated:** ✅ (16 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (111089ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### agent/g11

- **Prompt:** Travel planner bot with itinerary builder, tips, and budget tracker
- **Generated:** ✅ (16 files)
- **Pre-repair findings:** 1 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 1 (0 critical)
- **Build:** ✅ (117458ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### tools/t01

- **Prompt:** Internal user management tool with CRUD and role assignment
- **Generated:** ✅ (14 files)
- **Pre-repair findings:** 2 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 2 (0 critical)
- **Build:** ✅ (112966ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

### tools/t11

- **Prompt:** Image resizer tool with batch processing and format conversion
- **Generated:** ✅ (14 files)
- **Pre-repair findings:** 2 (0 critical)
- **Repair actions:** 0
- **Post-repair findings:** 2 (0 critical)
- **Build:** ✅ (115258ms)
- **TypeCheck:** ✅
- **Lint:** ✅
- **Score:** 95/100

---

## Repair Summary

| Action | Count |
|--------|-------|

---

## Next Steps

1. ✅ Build success rate meets 95% target
2. Proceed to Phase 6 (Memory & Learning Layer)
