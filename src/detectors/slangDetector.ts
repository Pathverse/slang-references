import type { Position, TextDocument, Uri } from 'vscode'
import { workspace } from 'vscode'

export interface SlangVariableDetection {
  variableName: string
  className: string
  range: { start: Position, end: Position }
}

export class SlangDetector {
  /**
   * Detects if the position is over a Slang translation variable
   */
  async detectSlangVariable(
    document: TextDocument, 
    position: Position,
  ): Promise<SlangVariableDetection | null> {
    try {
      const line = document.lineAt(position)
      const text = line.text
      
      // Get the word at the cursor position
      const wordRange = document.getWordRangeAtPosition(position)
      if (!wordRange) {
        return null
      }

      const word = document.getText(wordRange)
      
      // Check if this looks like a translation variable access
      // Pattern: t.variableName or translations.variableName
      const translationAccessPattern = /(\w+)\.([\w\d_]+)/g
      let match
      
      while ((match = translationAccessPattern.exec(text)) !== null) {
        const [fullMatch, objectName, variableName] = match
        const matchStart = match.index!
        const matchEnd = matchStart + fullMatch.length
        
        // Check if cursor is within this match
        const positionIndex = document.offsetAt(position)
        const lineStartOffset = document.offsetAt(line.range.start)
        const relativePosition = positionIndex - lineStartOffset
        
        if (relativePosition >= matchStart && relativePosition <= matchEnd) {
          // Check if the object is likely a Translations instance
          if (await this.isTranslationsVariable(objectName, document)) {
            return {
              variableName,
              className: objectName,
              range: {
                start: document.positionAt(lineStartOffset + matchStart),
                end: document.positionAt(lineStartOffset + matchEnd),
              },
            }
          }
        }
      }

      return null
    }
    catch (error) {
      console.debug('[Slang Detector] Error detecting variable:', error)
      return null
    }
  }

  /**
   * Checks if a variable name likely refers to a Slang Translations instance
   */
  private async isTranslationsVariable(variableName: string, document: TextDocument): Promise<boolean> {
    try {
      // Common Slang variable names
      const commonNames = ['t', 'translations', 'tr', 'i18n']
      if (commonNames.includes(variableName.toLowerCase())) {
        return true
      }

      // Look for Translations type declaration in the document
      const text = document.getText()
      
      // Pattern to match variable declarations with Translations type
      const declarationPatterns = [
        new RegExp(`\\b${variableName}\\s*=\\s*Translations\\.of`, 'i'),
        new RegExp(`\\bTranslations\\s+${variableName}\\b`, 'i'),
        new RegExp(`\\bfinal\\s+${variableName}\\s*=\\s*Translations`, 'i'),
        new RegExp(`\\bvar\\s+${variableName}\\s*=\\s*Translations`, 'i'),
      ]

      return declarationPatterns.some(pattern => pattern.test(text))
    }
    catch (error) {
      console.debug('[Slang Detector] Error checking translations variable:', error)
      return false
    }
  }

  /**
   * Finds strings.g.dart files in the workspace
   */
  async findStringsGeneratedFiles(): Promise<Uri[]> {
    try {
      const files = await workspace.findFiles('**/strings.g.dart', '**/node_modules/**')
      return files
    }
    catch (error) {
      console.debug('[Slang Detector] Error finding generated files:', error)
      return []
    }
  }

  /**
   * Checks if current workspace likely uses Slang
   */
  async isSlangProject(): Promise<boolean> {
    try {
      // Look for slang.yml or slang.yaml configuration files
      const configFiles = await workspace.findFiles('**/slang.{yml,yaml}', '**/node_modules/**')
      if (configFiles.length > 0) {
        return true
      }

      // Look for generated strings.g.dart files
      const generatedFiles = await this.findStringsGeneratedFiles()
      if (generatedFiles.length > 0) {
        return true
      }

      // Look for slang dependency in pubspec.yaml
      const pubspecFiles = await workspace.findFiles('**/pubspec.yaml', '**/node_modules/**')
      for (const pubspec of pubspecFiles) {
        const content = await workspace.fs.readFile(pubspec)
        const text = Buffer.from(content).toString('utf8')
        if (text.includes('slang:') || text.includes('slang_flutter:')) {
          return true
        }
      }

      return false
    }
    catch (error) {
      console.debug('[Slang Detector] Error checking Slang project:', error)
      return false
    }
  }
}