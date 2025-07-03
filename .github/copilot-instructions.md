---
applyTo: "**"
---

# TypeScript Node.js Project Standards

## Module System
- Use ES modules (`import`/`export`) - this project is configured with `"type": "module"` in package.json

## TypeScript Configuration
- Follow strict TypeScript settings - all strict options are enabled
- Use `NodeNext` module resolution and `ES2022` target
- Generate declaration files for all exported types
- Remove comments in compiled output
- Enable incremental compilation for faster builds

## Development Tools
- Use `tsx` for development with watch mode (`npm run dev`)
- Use `vitest` for testing (not Jest) - test files should use `.test.ts` extension (`npm run test`)
- Use `eslint` for linting (`npm run lint`)

## Code Style
- Use single quotes for strings
- Use 2 spaces for indentation
- Prefer `const` over `let` when possible
- Use async/await over promises (top-level await is supported)
- Use proper TypeScript types instead of `any`

## Testing
- Place test files alongside source files with `.test.ts` extension

## Environment Configuration
- Use dotenv for environment variables with `import 'dotenv/config'`
- Load environment configuration at the top of entry files

## Project Structure
- Source files in `src/` directory
- Compiled output in `dist/` directory
- Entry point: `src/index.ts` compiles to `dist/index.js`
- Type definitions generated as `dist/index.d.ts`

## Dependencies
- Keep dependencies minimal and focused
- Use `@types/node` for Node.js type definitions
- Prefer modern Node.js APIs and features