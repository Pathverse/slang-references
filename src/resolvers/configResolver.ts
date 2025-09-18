import * as path from 'node:path'
import * as yaml from 'js-yaml'
import { Uri, workspace } from 'vscode'

interface SlangConfig {
  base_locale: string
  input_directory: string
  output_directory?: string
  input_file_pattern?: string
  fallback_strategy?: string
}

export class ConfigResolver {
  private configCache = new Map<string, SlangConfig>()
  private translationCache = new Map<string, Map<string, any>>()

  /**
   * Resolves translation string from slang.yml configuration and JSON files
   */
  async resolveFromConfig(variableName: string, documentUri: Uri): Promise<string | null> {
    try {
      // Find the slang configuration file
      const config = await this.findSlangConfig(documentUri)
      if (!config) {
        return null
      }

      // Get the translation JSON content
      const translations = await this.getTranslations(config, documentUri)
      if (!translations) {
        return null
      }

      // Resolve the variable name to translation string
      return this.resolveTranslationValue(variableName, translations)
    }
    catch (error) {
      console.debug('[Config Resolver] Error resolving from config:', error)
      return null
    }
  }

  /**
   * Finds and parses the slang.yml configuration file
   */
  private async findSlangConfig(documentUri: Uri): Promise<SlangConfig | null> {
    try {
      // Look for slang configuration files
      const configFiles = await workspace.findFiles('**/slang.{yml,yaml}', '**/node_modules/**')

      if (configFiles.length === 0) {
        return null
      }

      // Find the closest config file to the document
      const configFile = this.findClosestConfig(documentUri, configFiles)
      const cacheKey = configFile.toString()

      // Return cached config if available
      if (this.configCache.has(cacheKey)) {
        return this.configCache.get(cacheKey)!
      }

      // Parse the configuration file
      const content = await workspace.fs.readFile(configFile)
      const text = Buffer.from(content).toString('utf8')
      const config = yaml.load(text) as SlangConfig

      // Set defaults
      const normalizedConfig: SlangConfig = {
        base_locale: config.base_locale || 'en',
        input_directory: config.input_directory || 'i18n',
        output_directory: config.output_directory || 'lib/i18n',
        input_file_pattern: config.input_file_pattern || '.json',
        fallback_strategy: config.fallback_strategy || 'base_locale',
      }

      this.configCache.set(cacheKey, normalizedConfig)
      return normalizedConfig
    }
    catch (error) {
      console.debug('[Config Resolver] Error finding slang config:', error)
      return null
    }
  }

  /**
   * Gets translations from JSON files based on configuration
   */
  private async getTranslations(config: SlangConfig, documentUri: Uri): Promise<Map<string, any> | null> {
    try {
      const configDir = await this.getConfigDirectory(documentUri)
      if (!configDir) {
        return null
      }

      // Build the translation file path
      const inputDir = path.join(configDir, config.input_directory)
      const translationFileName = `${config.base_locale}${config.input_file_pattern}`
      const translationFilePath = path.join(inputDir, translationFileName)

      // Convert to VS Code URI
      const translationUri = Uri.file(translationFilePath)
      const cacheKey = translationUri.toString()

      // Return cached translations if available
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey)!
      }

      // Read and parse the translation file
      try {
        const content = await workspace.fs.readFile(translationUri)
        const text = Buffer.from(content).toString('utf8')
        const translations = JSON.parse(text)

        // Flatten nested translations and cache
        const flatTranslations = this.flattenTranslations(translations)
        this.translationCache.set(cacheKey, flatTranslations)

        return flatTranslations
      }
      catch (fileError) {
        console.debug('[Config Resolver] Translation file not found or invalid:', translationFilePath)
        return null
      }
    }
    catch (error) {
      console.debug('[Config Resolver] Error getting translations:', error)
      return null
    }
  }

  /**
   * Finds the closest configuration file to the document
   */
  private findClosestConfig(documentUri: Uri, configFiles: Uri[]): Uri {
    if (configFiles.length === 1) {
      return configFiles[0]
    }

    const documentPath = documentUri.fsPath
    let bestMatch = configFiles[0]
    let shortestDistance = Infinity

    for (const configFile of configFiles) {
      const configPath = configFile.fsPath
      const commonLength = this.getCommonPathLength(documentPath, configPath)
      const distance = Math.abs(documentPath.length - commonLength)

      if (distance < shortestDistance) {
        shortestDistance = distance
        bestMatch = configFile
      }
    }

    return bestMatch
  }

  /**
   * Gets the directory containing the slang configuration
   */
  private async getConfigDirectory(documentUri: Uri): Promise<string | null> {
    try {
      const configFiles = await workspace.findFiles('**/slang.{yml,yaml}', '**/node_modules/**')
      if (configFiles.length === 0) {
        return null
      }

      const configFile = this.findClosestConfig(documentUri, configFiles)
      return path.dirname(configFile.fsPath)
    }
    catch (error) {
      console.debug('[Config Resolver] Error getting config directory:', error)
      return null
    }
  }

  /**
   * Flattens nested translation object into dot-notation keys
   */
  private flattenTranslations(obj: any, prefix = ''): Map<string, any> {
    const flattened = new Map<string, any>()

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively flatten nested objects
        const nested = this.flattenTranslations(value, newKey)
        for (const [nestedKey, nestedValue] of nested) {
          flattened.set(nestedKey, nestedValue)
        }
      }
      else {
        // Store primitive values and arrays
        flattened.set(newKey, value)
      }
    }

    return flattened
  }

  /**
   * Resolves a variable name to its translation value
   */
  private resolveTranslationValue(variableName: string, translations: Map<string, any>): string | null {
    // Try direct lookup
    if (translations.has(variableName)) {
      const value = translations.get(variableName)
      return typeof value === 'string' ? value : JSON.stringify(value)
    }

    // Try camelCase to snake_case conversion
    const snakeCase = this.camelToSnakeCase(variableName)
    if (translations.has(snakeCase)) {
      const value = translations.get(snakeCase)
      return typeof value === 'string' ? value : JSON.stringify(value)
    }

    // Try kebab-case conversion
    const kebabCase = this.camelToKebabCase(variableName)
    if (translations.has(kebabCase)) {
      const value = translations.get(kebabCase)
      return typeof value === 'string' ? value : JSON.stringify(value)
    }

    // Try finding partial matches
    for (const [key, value] of translations) {
      if (key.endsWith(variableName) || variableName.endsWith(key)) {
        return typeof value === 'string' ? value : JSON.stringify(value)
      }
    }

    return null
  }

  /**
   * Converts camelCase to snake_case
   */
  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  /**
   * Converts camelCase to kebab-case
   */
  private camelToKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  }

  /**
   * Gets the length of common path prefix between two paths
   */
  private getCommonPathLength(path1: string, path2: string): number {
    const parts1 = path1.split(/[/\\]/)
    const parts2 = path2.split(/[/\\]/)
    let commonLength = 0

    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        commonLength += parts1[i].length + 1
      }
      else {
        break
      }
    }

    return commonLength
  }

  /**
   * Clears all caches
   */
  clearCache(): void {
    this.configCache.clear()
    this.translationCache.clear()
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { configs: number, translations: number } {
    return {
      configs: this.configCache.size,
      translations: this.translationCache.size,
    }
  }
}
