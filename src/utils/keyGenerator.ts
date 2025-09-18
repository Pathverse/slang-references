export interface KeyGenerationOptions {
  maxLength?: number
  prefix?: string
  suffix?: string
  caseStyle?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase'
  removeSpecialChars?: boolean
  allowNumbers?: boolean
}

export class KeyGenerator {
  private static readonly DEFAULT_OPTIONS: Required<KeyGenerationOptions> = {
    maxLength: 20,
    prefix: '',
    suffix: '',
    caseStyle: 'camelCase',
    removeSpecialChars: true,
    allowNumbers: true,
  }

  /**
   * Generates a translation key from a string value
   */
  static generateKey(value: string, options: KeyGenerationOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }

    let key = value

    // Step 1: Clean and normalize the string
    key = this.normalizeString(key, opts)

    // Step 2: Truncate to max length (before applying case style to preserve word boundaries)
    if (opts.maxLength > 0) {
      key = this.truncateIntelligently(key, opts.maxLength)
    }

    // Step 3: Apply case style
    key = this.applyCaseStyle(key, opts.caseStyle)

    // Step 4: Add prefix and suffix
    if (opts.prefix) {
      key = opts.prefix + this.capitalizeFirst(key)
    }
    if (opts.suffix) {
      key = key + this.capitalizeFirst(opts.suffix)
    }

    // Step 5: Ensure it's a valid identifier
    key = this.ensureValidIdentifier(key)

    return key
  }

  /**
   * Generates multiple key suggestions for a string value
   */
  static generateKeySuggestions(value: string, filePath?: string): string[] {
    const suggestions: string[] = []

    // First suggestion: Simple rephrased name (as before)
    suggestions.push(this.generateKey(value))

    // Second suggestion: Nested structure based on file/folder context
    if (filePath) {
      const nestedKey = this.generateNestedKey(value, filePath)
      if (nestedKey) {
        suggestions.push(nestedKey)
      }
    }

    // Third suggestion: Always include a shorter version for custom input
    suggestions.push(this.generateKey(value, { maxLength: 15 }))

    // Remove duplicates and return
    return [...new Set(suggestions)]
  }

  /**
   * Generates a nested key based on file path structure
   */
  static generateNestedKey(value: string, filePath: string): string {
    try {
      // Extract meaningful path segments from the file path
      const pathSegments = this.extractPathSegments(filePath)

      if (pathSegments.length === 0) {
        return this.generateKey(value)
      }

      // Create nested structure: folder1.folder2.keyName
      const keyName = this.generateKey(value, { maxLength: 15 })
      const fullPath = [...pathSegments, keyName].join('.')

      return fullPath
    }
    catch (error) {
      console.debug('[Key Generator] Error generating nested key:', error)
      return this.generateKey(value)
    }
  }

  /**
   * Extracts meaningful path segments from a file path
   */
  private static extractPathSegments(filePath: string): string[] {
    try {
      // Convert to forward slashes and split
      const normalizedPath = filePath.replace(/\\/g, '/')
      const segments = normalizedPath.split('/')

      // Find meaningful segments (skip common ones like lib, src, etc.)
      const skipSegments = new Set(['lib', 'src', 'app', 'main', 'dart', 'flutter', 'packages', 'node_modules'])
      const meaningfulSegments: string[] = []

      // Start from the end and work backwards, but limit to 3 levels
      for (let i = segments.length - 1; i >= 0 && meaningfulSegments.length < 3; i--) {
        const segment = segments[i]

        // Skip file extensions and empty segments
        if (!segment || segment.includes('.')) {
          continue
        }

        // Skip common folder names
        if (skipSegments.has(segment.toLowerCase())) {
          continue
        }

        // Convert to valid key format
        const keySegment = this.generateKey(segment, { maxLength: 12 })
        if (keySegment && keySegment !== 'translationKey') {
          meaningfulSegments.unshift(keySegment)
        }
      }

      return meaningfulSegments
    }
    catch (error) {
      console.debug('[Key Generator] Error extracting path segments:', error)
      return []
    }
  }

  /**
   * Parses a nested key path into segments for JSON structure creation
   */
  static parseNestedKey(key: string): string[] {
    return key.split('.').filter(segment => segment.trim().length > 0)
  }

  /**
   * Validates a nested key (allows dots for nesting)
   */
  static validateNestedKey(key: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    // Check if empty
    if (!key || key.trim().length === 0) {
      errors.push('Key cannot be empty')
    }

    // Split by dots and validate each segment
    const segments = this.parseNestedKey(key)

    if (segments.length === 0) {
      errors.push('Key must contain at least one valid segment')
    }

    for (const segment of segments) {
      const segmentValidation = this.validateKey(segment)
      if (!segmentValidation.isValid) {
        errors.push(`Invalid segment "${segment}": ${segmentValidation.errors.join(', ')}`)
      }
    }

    // Check overall length
    if (key.length > 100) {
      errors.push('Nested key should be shorter than 100 characters')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Checks if a generated key would conflict with existing keys
   */
  static checkKeyConflict(key: string, existingKeys: Set<string>): boolean {
    return existingKeys.has(key)
  }

  /**
   * Generates a unique key by adding numeric suffix if needed
   */
  static generateUniqueKey(baseKey: string, existingKeys: Set<string>): string {
    if (!existingKeys.has(baseKey)) {
      return baseKey
    }

    let counter = 1
    let uniqueKey = `${baseKey}${counter}`

    while (existingKeys.has(uniqueKey)) {
      counter++
      uniqueKey = `${baseKey}${counter}`
    }

    return uniqueKey
  }

  /**
   * Normalizes a string by removing/replacing special characters
   */
  private static normalizeString(str: string, options: Required<KeyGenerationOptions>): string {
    let normalized = str

    // Remove or replace special characters
    if (options.removeSpecialChars) {
      // Replace common separators with spaces
      normalized = normalized.replace(/[-_./\\]/g, ' ')

      // Remove other special characters
      normalized = normalized.replace(/[^\w\s]/g, '')
    }

    // Handle numbers
    if (!options.allowNumbers) {
      normalized = normalized.replace(/\d/g, '')
    }

    // Clean up multiple spaces and trim
    normalized = normalized.replace(/\s+/g, ' ').trim()

    return normalized
  }

  /**
   * Truncates a string intelligently, trying to preserve word boundaries
   */
  private static truncateIntelligently(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str
    }

    const words = str.split(' ')
    let result = ''

    for (const word of words) {
      const testResult = result ? `${result} ${word}` : word

      if (testResult.length <= maxLength) {
        result = testResult
      }
      else {
        break
      }
    }

    // If we couldn't fit even one word, just truncate
    if (!result) {
      result = str.substring(0, maxLength)
    }

    return result
  }

  /**
   * Applies the specified case style to a string
   */
  private static applyCaseStyle(str: string, caseStyle: KeyGenerationOptions['caseStyle']): string {
    const words = str.split(' ').filter(word => word.length > 0)

    switch (caseStyle) {
      case 'camelCase':
        return words.map((word, index) =>
          index === 0 ? word.toLowerCase() : this.capitalizeFirst(word.toLowerCase()),
        ).join('')

      case 'PascalCase':
        return words.map(word => this.capitalizeFirst(word.toLowerCase())).join('')

      case 'snake_case':
        return words.map(word => word.toLowerCase()).join('_')

      case 'kebab-case':
        return words.map(word => word.toLowerCase()).join('-')

      default:
        return words.join('')
    }
  }

  /**
   * Capitalizes the first letter of a string
   */
  private static capitalizeFirst(str: string): string {
    if (str.length === 0)
      return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Ensures the generated key is a valid identifier
   */
  private static ensureValidIdentifier(key: string): string {
    // Must start with letter or underscore
    if (key.length > 0 && /^\d/.test(key)) {
      key = `_${key}`
    }

    // Replace any remaining invalid characters
    key = key.replace(/\W/g, '_')

    // Ensure it's not empty
    if (key.length === 0) {
      key = 'translationKey'
    }

    return key
  }

  /**
   * Checks if the value appears to be a question
   */
  private static isQuestion(value: string): boolean {
    return value.includes('?') || /^(what|how|when|where|why|who|which|can|could|would|should|does|did|is|are|was|were)/i.test(value.trim())
  }

  /**
   * Checks if the value appears to be an error message
   */
  private static isError(value: string): boolean {
    const errorKeywords = ['error', 'failed', 'invalid', 'wrong', 'cannot', 'unable', 'not found', 'forbidden', 'unauthorized']
    const lowerValue = value.toLowerCase()
    return errorKeywords.some(keyword => lowerValue.includes(keyword))
  }

  /**
   * Checks if the value appears to be button text
   */
  private static isButton(value: string): boolean {
    const buttonKeywords = ['click', 'tap', 'press', 'submit', 'save', 'cancel', 'ok', 'yes', 'no', 'continue', 'next', 'back', 'finish']
    const lowerValue = value.toLowerCase()
    return buttonKeywords.some(keyword => lowerValue.includes(keyword)) || value.length <= 15
  }

  /**
   * Checks if the value appears to be a title
   */
  private static isTitle(value: string): boolean {
    // Title if it's short and starts with capital letter, or contains "title" keyword
    return (value.length <= 50 && /^[A-Z]/.test(value)) || /title|heading|header/i.test(value)
  }

  /**
   * Validates that a key follows naming conventions
   */
  static validateKey(key: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    // Check if empty
    if (!key || key.trim().length === 0) {
      errors.push('Key cannot be empty')
    }

    // Check if valid identifier
    if (!/^[a-z_]\w*$/i.test(key)) {
      errors.push('Key must be a valid identifier (letters, numbers, underscore, starting with letter or underscore)')
    }

    // Check length
    if (key.length > 50) {
      errors.push('Key should be shorter than 50 characters')
    }

    // Check for reserved words (basic check)
    const reservedWords = ['class', 'if', 'else', 'for', 'while', 'return', 'function', 'var', 'let', 'const']
    if (reservedWords.includes(key.toLowerCase())) {
      errors.push('Key cannot be a reserved word')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
