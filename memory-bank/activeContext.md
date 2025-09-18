# Active Context: Slang References Extension

## Current Work Focus
**Phase**: Core Implementation Complete
**Goal**: Basic hover functionality implemented and ready for testing

## Recent Changes
- **Complete Core Implementation**: All major components implemented and building successfully
- **Extension Manifest**: Configured package.json for Dart language support and proper activation
- **Hover Provider**: Full implementation with VS Code language feature registration
- **Variable Detection**: Smart detection of Slang Translations class variables
- **Dual Resolution**: Both comment-based and configuration-based translation lookup
- **Dependencies**: Added js-yaml for configuration parsing

## Next Steps

### Immediate (Testing & Validation)
1. **Extension Testing**: Test in VS Code development host with sample Dart/Slang projects
2. **Edge Case Testing**: Validate detection accuracy and resolution fallbacks
3. **Performance Testing**: Ensure hover response times are acceptable
4. **Error Handling Validation**: Test graceful failure modes

### Short Term (Polish & Optimization)
1. **User Experience**: Improve hover content formatting and information display
2. **Performance Optimization**: Fine-tune caching strategies and file parsing
3. **Configuration Support**: Test various slang.yml configurations and edge cases
4. **Documentation**: Create comprehensive README with setup and usage examples

### Medium Term (Advanced Features)
1. **Multi-Language Support**: Extend beyond default language display
2. **Jump-to-Definition**: Navigate to translation file locations
3. **Auto-completion**: Suggest available translation keys
4. **Workspace Integration**: Better multi-folder workspace support

## Active Decisions and Considerations

### Implementation Approach
- **Start Simple**: Begin with comment extraction before configuration parsing
- **Incremental Development**: Build and test each resolution method independently
- **User Experience First**: Prioritize reliable hover experience over advanced features

### Technical Choices
- **File Detection Strategy**: Use VS Code's file search API for `strings.g.dart` files
- **Parsing Approach**: Regular expressions for comment extraction, YAML library for config
- **Caching Policy**: File-level caching with workspace-scoped cleanup

## Important Patterns and Preferences

### Code Organization
```typescript
src/
  index.ts              // Extension entry point
  providers/
    hoverProvider.ts    // Main hover logic
  detectors/
    slangDetector.ts    // Variable detection
  resolvers/
    commentResolver.ts  // Comment-based resolution
    configResolver.ts   // Configuration-based resolution
  utils/
    cache.ts           // Caching utilities
    fileUtils.ts       // File system helpers
```

### Development Principles
- **Reactive Patterns**: Leverage reactive-vscode framework effectively
- **Type Safety**: Strong TypeScript typing for all components
- **Error Resilience**: Never break user's development flow
- **Performance Mindful**: Optimize for hover response time

## Learnings and Project Insights

### Slang Library Understanding
- **Generated Files**: `strings.g.dart` contains both comments and implementation
- **Configuration Flexibility**: slang.yml controls input/output directories and patterns
- **Dual Resolution Need**: Some projects may not have comments, requiring config lookup

### VS Code Extension Context
- **Hover Provider Pattern**: Standard VS Code language feature integration
- **Workspace Awareness**: Must handle multi-folder workspaces and nested projects
- **Language Server Coexistence**: Work alongside Dart LSP without interference

### User Experience Considerations
- **Zero Configuration**: Should work immediately in standard Slang projects
- **Silent Operation**: No intrusive error messages or notifications
- **Fast Response**: Hover tooltips must appear without noticeable delay

## Current Environment State
- **Project Template**: Based on antfu's VS Code extension starter
- **Build System**: Configured with tsdown and pnpm
- **Framework**: reactive-vscode ready for implementation
- **Testing**: Vitest configured but no tests written yet

## Open Questions
1. **Package Detection**: How to reliably identify Slang-enabled projects?
2. **Multi-Package Support**: Handle complex workspace structures?
3. **Configuration Variants**: Support different slang.yml locations/structures?
4. **Performance Baseline**: What response time is acceptable for hover?

These questions will be resolved during implementation as we encounter real-world scenarios and edge cases.