---
name: project-typescript-migration
description: GlowStyle AI project has been fully migrated from JavaScript to TypeScript
metadata:
  type: project
---

All source files converted from .js/.jsx to .ts/.tsx (completed 2026-05-20).

**Why:** User requested full TypeScript migration for better type safety.

**How to apply:** All new files should be written as .ts or .tsx. Do not create .js files in src/. The tsconfig.json has strict: false — permissive mode is intentional.

Key file locations:
- Types: `src/types/index.ts` (WardrobeItem, OutfitData, WeatherData, RootTabParamList, etc.)
- Screens use `BottomTabScreenProps<RootTabParamList, 'ScreenName'>` from `@react-navigation/bottom-tabs`
- App entry: `App.tsx` (root)

[[project-structure]]
