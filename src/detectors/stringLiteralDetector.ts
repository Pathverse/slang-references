import type { TextDocument } from 'vscode'
import { Position, Range } from 'vscode'

export interface StringLiteralDetection {
  value: string
  range: Range
  isInMethodCall: boolean
  methodName?: string
  parameterIndex?: number
  context: 'parameter' | 'argument' | 'assignment' | 'other'
}

export class StringLiteralDetector {
  /**
   * Detects if the position is over a string literal that could be converted to a translation
   */
  async detectStringLiteral(
    document: TextDocument,
    position: Position,
  ): Promise<StringLiteralDetection | null> {
    try {
      // console.log('[String Literal Detector] Checking position:', position.line, position.character)
      const line = document.lineAt(position)
      const text = line.text
      // console.log('[String Literal Detector] Line text:', text)

      // Get the word/token at the cursor position - use a broader regex to catch strings
      const wordRange = document.getWordRangeAtPosition(position, /["'`][^"'`]*["'`]/g)
      // console.log('[String Literal Detector] Word range:', wordRange)

      if (!wordRange) {
        // If no word range found, try to find string manually by checking character at position
        const charAtPosition = text[position.character]
        // console.log('[String Literal Detector] Char at position:', charAtPosition)

        if (charAtPosition === '"' || charAtPosition === '\'' || charAtPosition === '`') {
          // We're at the start/end of a string, find the full string
          const stringRange = this.findStringRangeAt(document, position)
          if (stringRange) {
            const stringLiteral = document.getText(stringRange)
            // console.log('[String Literal Detector] Found string manually:', stringLiteral)

            if (this.isStringLiteral(stringLiteral)) {
              const value = this.extractStringValue(stringLiteral)
              if (this.shouldBeTranslated(value)) {
                const context = await this.analyzeContext(document, stringRange, line)
                return {
                  value,
                  range: stringRange,
                  isInMethodCall: context.isInMethodCall,
                  methodName: context.methodName,
                  parameterIndex: context.parameterIndex,
                  context: context.type,
                }
              }
            }
          }
        }

        // Try looking around the cursor position for a string
        for (let offset = -10; offset <= 10; offset++) {
          const checkPos = new Position(position.line, Math.max(0, position.character + offset))
          const charAtCheck = text[checkPos.character]
          if (charAtCheck === '"' || charAtCheck === '\'' || charAtCheck === '`') {
            const stringRange = this.findStringRangeAt(document, checkPos)
            if (stringRange && stringRange.contains(position)) {
              const stringLiteral = document.getText(stringRange)
              // console.log('[String Literal Detector] Found string in vicinity:', stringLiteral)

              if (this.isStringLiteral(stringLiteral)) {
                const value = this.extractStringValue(stringLiteral)
                if (this.shouldBeTranslated(value)) {
                  const context = await this.analyzeContext(document, stringRange, line)
                  return {
                    value,
                    range: stringRange,
                    isInMethodCall: context.isInMethodCall,
                    methodName: context.methodName,
                    parameterIndex: context.parameterIndex,
                    context: context.type,
                  }
                }
              }
            }
          }
        }

        return null
      }

      const stringLiteral = document.getText(wordRange)
      // console.log('[String Literal Detector] String literal found:', stringLiteral)

      // Check if it's actually a string literal
      if (!this.isStringLiteral(stringLiteral)) {
        // console.log('[String Literal Detector] Not a valid string literal')
        return null
      }

      // Extract the string value (remove quotes)
      const value = this.extractStringValue(stringLiteral)
      // console.log('[String Literal Detector] Extracted value:', value)

      // Skip very short strings or strings that look like they shouldn't be translated
      if (!this.shouldBeTranslated(value)) {
        // console.log('[String Literal Detector] Should not be translated')
        return null
      }

      // Analyze the context to determine if this is in a method call or constructor
      const context = await this.analyzeContext(document, wordRange, line)
      // console.log('[String Literal Detector] Context analysis:', context)

      const result = {
        value,
        range: wordRange,
        isInMethodCall: context.isInMethodCall,
        methodName: context.methodName,
        parameterIndex: context.parameterIndex,
        context: context.type,
      }

      // console.log('[String Literal Detector] Final result:', result)
      return result
    }
    catch (error) {
      console.debug('[String Literal Detector] Error detecting string literal:', error)
      return null
    }
  }

  /**
   * Finds the full range of a string literal starting at a given position
   */
  private findStringRangeAt(document: TextDocument, position: Position): Range | null {
    try {
      const line = document.lineAt(position)
      const text = line.text
      const char = text[position.character]

      if (char !== '"' && char !== '\'' && char !== '`') {
        // Look for the start of a string around this position
        let stringStart = -1
        let stringEnd = -1
        let quote = ''

        // Search backwards for opening quote
        for (let i = position.character; i >= 0; i--) {
          const c = text[i]
          if (c === '"' || c === '\'' || c === '`') {
            stringStart = i
            quote = c
            break
          }
        }

        if (stringStart === -1)
          return null

        // Search forwards for closing quote
        for (let i = stringStart + 1; i < text.length; i++) {
          const c = text[i]
          if (c === quote && text[i - 1] !== '\\') {
            stringEnd = i
            break
          }
        }

        if (stringEnd === -1)
          return null

        return new Range(
          new Position(position.line, stringStart),
          new Position(position.line, stringEnd + 1),
        )
      }

      // We're at a quote character, find the matching quote
      const quote = char
      let stringStart = position.character
      let stringEnd = -1

      // If we're at a closing quote, search backwards for opening quote
      if (position.character > 0) {
        for (let i = position.character - 1; i >= 0; i--) {
          const c = text[i]
          if (c === quote && (i === 0 || text[i - 1] !== '\\')) {
            stringStart = i
            stringEnd = position.character
            break
          }
        }
      }

      // If not found, search forward for closing quote
      if (stringEnd === -1) {
        for (let i = position.character + 1; i < text.length; i++) {
          const c = text[i]
          if (c === quote && text[i - 1] !== '\\') {
            stringEnd = i
            break
          }
        }
      }

      if (stringEnd === -1)
        return null

      return new Range(
        new Position(position.line, stringStart),
        new Position(position.line, stringEnd + 1),
      )
    }
    catch (error) {
      console.debug('[String Literal Detector] Error finding string range:', error)
      return null
    }
  }

  /**
   * Checks if the text is a string literal
   */
  private isStringLiteral(text: string): boolean {
    const trimmed = text.trim()
    return (
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith('\'') && trimmed.endsWith('\''))
      || (trimmed.startsWith('`') && trimmed.endsWith('`'))
    )
  }

  /**
   * Extracts the actual string value from a string literal (removes quotes)
   */
  private extractStringValue(literal: string): string {
    const trimmed = literal.trim()
    return trimmed.slice(1, -1) // Remove first and last character (quotes)
  }

  /**
   * Determines if a string should be considered for translation
   */
  private shouldBeTranslated(value: string): boolean {
    // console.log('[String Literal Detector] Checking if should be translated:', value)

    // Skip very short strings
    if (value.length < 2) {
      // console.log('[String Literal Detector] Too short')
      return false
    }

    // Skip strings that are likely not user-facing text
    const skipPatterns = [
      /^\d+$/, // Pure numbers
      /^[a-f0-9]+$/i, // Hex values
      /^(true|false|null)$/i, // Boolean/null values
      /^(get|post|put|delete|patch)$/i, // HTTP methods
      /^\w+:\/\//, // URLs
      /^\/[^/\s]*/, // File paths starting with /
      /^\$\{/, // Template strings with variables
      /^#[0-9a-f]{3,6}$/i, // Color codes
      /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/, // Numbers with decimals
      /^\w+\.\w+/, // Property access patterns
    ]

    const shouldTranslate = !skipPatterns.some(pattern => pattern.test(value))
    // console.log('[String Literal Detector] Should translate result:', shouldTranslate)
    return shouldTranslate
  }

  /**
   * Analyzes the context around a string literal to determine where it's used
   */
  private async analyzeContext(
    document: TextDocument,
    stringRange: Range,
    currentLine: any,
  ): Promise<{
      isInMethodCall: boolean
      methodName?: string
      parameterIndex?: number
      type: 'parameter' | 'argument' | 'assignment' | 'other'
    }> {
    const lineText = currentLine.text
    const stringStart = stringRange.start.character
    const stringEnd = stringRange.end.character

    // Look for method call patterns
    const methodCallPattern = /(\w+)\s*\(/g
    let methodMatch

    while ((methodMatch = methodCallPattern.exec(lineText)) !== null) {
      const methodName = methodMatch[1]
      const openParenIndex = methodMatch.index! + methodName.length

      // Find the matching closing parenthesis
      const closingParenIndex = this.findMatchingParen(lineText, openParenIndex)

      if (closingParenIndex !== -1 && stringStart > openParenIndex && stringEnd < closingParenIndex) {
        // String is inside this method call
        const parameterIndex = this.getParameterIndex(lineText, openParenIndex, stringStart)

        return {
          isInMethodCall: true,
          methodName,
          parameterIndex,
          type: 'argument',
        }
      }
    }

    // Look for constructor calls (CapitalizedName(...))
    const constructorPattern = /\b([A-Z]\w*)\s*\(/g
    let constructorMatch

    while ((constructorMatch = constructorPattern.exec(lineText)) !== null) {
      const constructorName = constructorMatch[1]
      const openParenIndex = constructorMatch.index! + constructorName.length

      const closingParenIndex = this.findMatchingParen(lineText, openParenIndex)

      if (closingParenIndex !== -1 && stringStart > openParenIndex && stringEnd < closingParenIndex) {
        const parameterIndex = this.getParameterIndex(lineText, openParenIndex, stringStart)

        return {
          isInMethodCall: true,
          methodName: constructorName,
          parameterIndex,
          type: 'parameter',
        }
      }
    }

    // Look for assignment patterns
    const assignmentPattern = /(\w+)\s*[:=]\s*/g
    let assignmentMatch

    while ((assignmentMatch = assignmentPattern.exec(lineText)) !== null) {
      const assignmentEnd = assignmentMatch.index! + assignmentMatch[0].length

      if (stringStart >= assignmentEnd) {
        return {
          isInMethodCall: false,
          type: 'assignment',
        }
      }
    }

    return {
      isInMethodCall: false,
      type: 'other',
    }
  }

  /**
   * Finds the matching closing parenthesis for an opening parenthesis
   */
  private findMatchingParen(text: string, openIndex: number): number {
    let depth = 0
    let inString = false
    let stringChar = ''

    for (let i = openIndex; i < text.length; i++) {
      const char = text[i]

      if (inString) {
        if (char === stringChar && text[i - 1] !== '\\') {
          inString = false
        }
        continue
      }

      if (char === '"' || char === '\'' || char === '`') {
        inString = true
        stringChar = char
        continue
      }

      if (char === '(') {
        depth++
      }
      else if (char === ')') {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }

    return -1
  }

  /**
   * Gets the parameter index of a string within a method call
   */
  private getParameterIndex(text: string, openParenIndex: number, stringPosition: number): number {
    let paramIndex = 0
    let depth = 0
    let inString = false
    let stringChar = ''

    for (let i = openParenIndex + 1; i < stringPosition && i < text.length; i++) {
      const char = text[i]

      if (inString) {
        if (char === stringChar && text[i - 1] !== '\\') {
          inString = false
        }
        continue
      }

      if (char === '"' || char === '\'' || char === '`') {
        inString = true
        stringChar = char
        continue
      }

      if (char === '(' || char === '[' || char === '{') {
        depth++
      }
      else if (char === ')' || char === ']' || char === '}') {
        depth--
      }
      else if (char === ',' && depth === 0) {
        paramIndex++
      }
    }

    return paramIndex
  }

  /**
   * Finds all string literals in a document that could be translated
   */
  async findAllTranslatableStrings(document: TextDocument): Promise<StringLiteralDetection[]> {
    const results: StringLiteralDetection[] = []
    const text = document.getText()
    const lines = text.split('\n')

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const stringLiteralPattern = /(['"`])((?:(?!\1)[^\\]|\\.)*)?\1/g
      let match

      while ((match = stringLiteralPattern.exec(line)) !== null) {
        const stringStart = match.index!
        const stringEnd = stringStart + match[0].length

        const position = new Position(lineIndex, stringStart)
        const detection = await this.detectStringLiteral(document, position)

        if (detection) {
          results.push(detection)
        }
      }
    }

    return results
  }
}
