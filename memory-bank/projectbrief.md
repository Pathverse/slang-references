# Project Brief: Slang References VS Code Extension

## Core Purpose
A VS Code extension that provides intelligent hover support for Dart/Flutter projects using the Slang i18n library. When developers hover over variables of the `Translations` class, they see the actual default language string content.

## Key Requirements

### Primary Feature
- **Hover Provider**: Display default language strings when hovering over Slang `Translations` class variables
- **Target Pattern**: Variables declared in `package:{somepkg}/i18n/strings.g.dart`
- **Language Support**: Dart/Flutter projects using Slang i18n library

### Data Sources
1. **Direct Variable Lookup**: Extract strings from generated Dart code comments
   ```dart
   /// en: 'Contact & Feedback'
   String get contactAndFeedback => 'Contact & Feedback';
   ```

2. **Configuration-Based Lookup**: Parse `slang.yml` and corresponding JSON files
   ```yaml
   base_locale: en
   input_directory: i18n
   input_file_pattern: .json
   ```
   Then read from `i18n/en.json`

## Project Scope
- **In Scope**: Hover functionality for Slang Translations variables
- **Out of Scope**: Full i18n management, code generation, or other language providers
- **Target Users**: Dart/Flutter developers using Slang for internationalization

## Success Criteria
- Accurate detection of Slang Translations variables
- Reliable extraction of default language strings
- Smooth hover experience with minimal performance impact
- Support for both direct lookup and configuration-based resolution

## Technical Foundation
- VS Code Extension using reactive-vscode framework
- TypeScript implementation
- Dart/Flutter project awareness
- File system parsing for YAML/JSON configuration