# Slang References

<a href="https://marketplace.visualstudio.com/items?itemName=pathverse.slang-references" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/pathverse.slang-references.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

VS Code extension for [Slang i18n](https://pub.dev/packages/slang) with hover translations and string-to-key conversion.

## Features

### 🔍 Hover Translations
Hover over translation variables to see their values:

```dart
Text(t.welcomeMessage) // Hover shows: "Welcome to our app!"
```

### 🔄 String Conversion
Convert hardcoded strings to translation keys with `Ctrl+.`:

```dart
// Before
Text("Hello World")

// After conversion
Text(t.helloWorld) // Automatically added to JSON
```

**Three conversion options:**
- Simple key: `helloWorld`
- Nested key: `pages.home.helloWorld` 
- Custom key: User input with dot notation support

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pathverse.slang-references) or search "Slang References" in Extensions.

## Usage

### Hover Support
Just hover over any `t.translationKey` to see the translation string.

### String Conversion
1. Place cursor in a string literal: `Text("Your text here")`
2. Press `Ctrl+.` (or `Cmd+.` on Mac)
3. Select conversion option
4. String is replaced with `t.generatedKey` and added to your base locale JSON

### Custom Keys
Use dot notation for organization:
```
ui.buttons.submit → { "ui": { "buttons": { "submit": "Submit" } } }
```

## Configuration

```json
{
  "slangReferences.enabled": true,
  "slangReferences.stringToTranslation.enabled": true,
  "slangReferences.stringToTranslation.caseStyle": "camelCase"
}
```

## Requirements

- Dart/Flutter project with [Slang](https://pub.dev/packages/slang) setup
- Generated `strings.g.dart` files
- Valid `slang.yml` configuration

## License

[MIT](./LICENSE.md) License © 2025 [Pathverse](https://github.com/Pathverse)
