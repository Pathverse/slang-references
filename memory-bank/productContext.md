# Product Context: Slang References Extension

## Why This Extension Exists

### Developer Pain Point
Dart/Flutter developers using Slang for internationalization often work with generated code that obscures the actual translated content. When working with variables like `t.contactAndFeedback`, developers need to:
- Navigate to generated files to see the actual string
- Remember what the translation says
- Switch between files to understand context

### The Solution
Provide immediate access to default language strings through hover tooltips, keeping developers in their flow without context switching.

## How It Should Work

### Core User Experience
1. **Seamless Integration**: Works automatically in Dart/Flutter projects with Slang
2. **Instant Feedback**: Hover over any Translations variable to see the actual string
3. **Smart Detection**: Automatically identifies Slang-generated variables
4. **Dual Resolution**: Falls back gracefully between direct code lookup and configuration-based resolution

### User Journey
```
Developer hovers over `t.contactAndFeedback` 
    ↓
Extension detects Slang Translations variable
    ↓
Looks up default language string via:
  - Direct code comments, OR
  - slang.yml + JSON file resolution
    ↓
Displays "Contact & Feedback" in hover tooltip
```

## Problems It Solves

### Primary Problems
- **Context Loss**: Eliminates need to navigate away from current code
- **Cognitive Load**: Reduces mental mapping between variable names and actual content
- **Development Speed**: Faster understanding of what translations will display

### Secondary Benefits
- **Code Review**: Easier to verify correct translations are used
- **Debugging**: Quick identification of translation content during development
- **Onboarding**: New team members understand translation content faster

## User Experience Goals

### Performance
- **Instant Response**: Hover information appears without noticeable delay
- **Non-Blocking**: Extension doesn't slow down editor performance
- **Memory Efficient**: Minimal impact on VS Code resource usage

### Reliability
- **Accurate Detection**: Only activates on actual Slang Translations variables
- **Graceful Fallback**: Works even if some resolution methods fail
- **Error Handling**: Fails silently without disrupting development

### Usability
- **Zero Configuration**: Works out of the box for standard Slang setups
- **Clear Display**: Translation content is easy to read and understand
- **Contextual**: Shows relevant information without overwhelming details