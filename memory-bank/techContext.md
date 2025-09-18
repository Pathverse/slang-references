# Technical Context: Slang References Extension

## Technology Stack

### Core Technologies
- **TypeScript**: Primary development language for type safety and Dart ecosystem compatibility
- **reactive-vscode**: Extension framework for reactive programming model
- **VS Code API**: Language Server Protocol integration for hover providers
- **Node.js**: Runtime environment for extension execution

### Development Environment
- **Package Manager**: pnpm (configured in workspace)
- **Build Tool**: tsdown for TypeScript compilation
- **Testing**: Vitest for unit testing
- **Linting**: ESLint with @antfu/eslint-config

### Dependencies
```json
{
  "reactive-vscode": "^0.2.10",  // Extension framework
  "@types/vscode": "^1.97.0",    // VS Code API types
  "typescript": "^5.7.3"         // TypeScript compiler
}
```

## Development Setup

### Build Configuration
- **Entry Point**: `src/index.ts`
- **Output**: `dist/index.js` (bundled for distribution)
- **Source Maps**: Enabled for development mode
- **External Dependencies**: vscode API marked as external

### Scripts
- `npm run dev`: Watch mode development with source maps
- `npm run build`: Production build
- `npm run test`: Unit tests with Vitest
- `npm run typecheck`: TypeScript validation

## Technical Constraints

### VS Code Requirements
- **Minimum Version**: VS Code ^1.97.0
- **Activation**: onStartupFinished (minimal performance impact)
- **Extension Host**: Runs in extension host process (not web worker)

### Dart/Flutter Ecosystem
- **File Patterns**: Must detect `strings.g.dart` files accurately
- **Package Structure**: Support standard Dart package layouts
- **Slang Versions**: Support common Slang library patterns

### Performance Requirements
- **Hover Response Time**: < 100ms for good UX
- **Memory Usage**: Minimal impact on VS Code memory footprint
- **File System Access**: Efficient parsing without blocking UI

## Tool Usage Patterns

### File System Operations
```typescript
// Pattern for detecting Slang files
const slangFilePattern = '**/i18n/strings.g.dart'
const configFilePattern = '**/slang.yml'
```

### VS Code API Integration
- **Hover Provider**: Register for Dart language files
- **Workspace API**: File searching and reading
- **Language Features**: Symbol detection and parsing

### Configuration Management
- **YAML Parsing**: For slang.yml configuration files
- **JSON Parsing**: For translation data files
- **Path Resolution**: Relative to workspace root

## Integration Points

### Dart Language Server
- **Coexistence**: Work alongside Dart LSP without conflicts
- **Symbol Information**: Leverage VS Code's existing symbol detection
- **Type Information**: Detect Translations class instances

### File System Monitoring
- **Optional Enhancement**: Watch for translation file changes
- **Cache Invalidation**: Update cached translations when files change
- **Workspace Events**: Respond to file additions/deletions

### Error Handling
- **Parse Errors**: Graceful handling of malformed YAML/JSON
- **Missing Files**: Silent fallback when files don't exist
- **Permission Issues**: Handle file access restrictions

## Development Patterns

### Reactive Programming
```typescript
// Using reactive-vscode patterns
const { activate, deactivate } = defineExtension(() => {
  // Extension logic with reactive state management
})
```

### TypeScript Best Practices
- **Strict Mode**: Full TypeScript strict mode enabled
- **Interface Definitions**: Clear contracts for all components
- **Type Guards**: Runtime type checking for parsed data

### Testing Strategy
- **Unit Tests**: Individual component testing with Vitest
- **Integration Tests**: End-to-end hover functionality
- **Mock Data**: Sample Dart files and configurations for testing