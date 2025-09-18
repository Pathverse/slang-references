# System Patterns: Slang References Extension

## Architecture Overview

### Extension Structure
```
Extension Entry Point (reactive-vscode)
    ↓
Hover Provider Registration
    ↓
Slang Variable Detection
    ↓
Translation Resolution Engine
    ↓
Content Display
```

## Key Technical Decisions

### Framework Choice
- **reactive-vscode**: Chosen for reactive programming model and simplified extension development
- **TypeScript**: Type safety for Dart ecosystem integration and VS Code API usage

### Detection Strategy
- **File Pattern Matching**: Identify `strings.g.dart` files in `i18n` directories
- **Symbol Analysis**: Parse variable declarations to identify Translations class members
- **Context Awareness**: Ensure hover only activates on legitimate Slang variables

### Resolution Engine Design
```typescript
interface TranslationResolver {
  // Primary: Direct code comment extraction
  extractFromComments: (variable: string) => string | null

  // Secondary: Configuration-based lookup
  resolveFromConfig: (variable: string) => string | null
}
```

## Design Patterns

### Provider Pattern
- **Hover Provider**: VS Code's HoverProvider interface implementation
- **Lazy Loading**: Translation data loaded on-demand, not at startup
- **Caching Strategy**: Intelligent caching to avoid repeated file parsing

### Strategy Pattern
```typescript
enum ResolutionStrategy {
  DIRECT_COMMENTS, // Parse /// en: 'string' comments
  CONFIG_BASED // Use slang.yml + JSON files
}
```

### Chain of Responsibility
```
Variable Detection → Comment Extraction → Config Resolution → Fallback
```

## Component Relationships

### Core Components
1. **Variable Detector**: Identifies Slang Translations variables
2. **Comment Parser**: Extracts strings from generated code comments
3. **Config Reader**: Parses slang.yml and associated JSON files
4. **Content Formatter**: Prepares hover content for display

### Data Flow
```
Hover Event → Variable Detection → Resolution Chain → Content Display
```

### File System Integration
- **Workspace Scanner**: Locate slang.yml configuration files
- **Path Resolution**: Map from variable location to translation files
- **File Watcher**: Optional reactive updates when translation files change

## Critical Implementation Paths

### Primary Path: Comment Extraction
```typescript
// Target pattern in strings.g.dart:
/// en: 'Contact & Feedback'
String get contactAndFeedback => 'Contact & Feedback';
```

### Secondary Path: Configuration Resolution
```yaml
# Parse slang.yml:
base_locale: en
input_directory: i18n
input_file_pattern: .json
```

Then read i18n/en.json:
```json
{
  "contactAndFeedback": "Contact & Feedback"
}
```

### Error Handling Strategy
- **Graceful Degradation**: If primary method fails, try secondary
- **Silent Failures**: Don't show error hovers, just skip enhancement
- **Logging**: Debug information for development without user interruption

## Performance Considerations

### Caching Strategy
- **File-Level Cache**: Cache parsed translation files per workspace
- **Variable-Level Cache**: Cache resolved strings per variable
- **TTL Policy**: Reasonable expiration to handle file changes

### Optimization Points
- **Lazy File Reading**: Only parse files when hover is triggered
- **Debounced Parsing**: Avoid excessive file system operations
- **Memory Management**: Clean up caches when workspace changes
