import * as path from 'node:path'
import * as yaml from 'js-yaml'
import { Uri, window, workspace } from 'vscode'
import { ConfigResolver } from '../resolvers/configResolver'

export interface TranslationEntry {
  key: string
  value: string
  nested?: boolean
  parentKey?: string
}

export interface WriteResult {
  success: boolean
  filePath?: string
  error?: string
  keyAdded?: string
}

export class TranslationFileWriter {
  private configResolver: ConfigResolver

  constructor() {
    this.configResolver = new ConfigResolver()
  }

  /**
   * Adds a translation entry to the base locale JSON file
   */
  async addTranslation(
    entry: TranslationEntry,
    documentUri: Uri,
  ): Promise<WriteResult> {
    try {
      // console.log('[Translation File Writer] Adding translation:', entry)
      // console.log('[Translation File Writer] Document URI:', documentUri.toString())

      // Find the target translation file
      const translationFile = await this.findTranslationFile(documentUri)
      if (!translationFile) {
        console.error('[Translation File Writer] Could not find translation file')
        return {
          success: false,
          error: 'Could not find translation file. Make sure slang.yml is configured properly.',
        }
      }

      // console.log('[Translation File Writer] Found translation file:', translationFile.fsPath)

      // Read existing translations
      const existingTranslations = await this.readTranslationFile(translationFile)
      // console.log('[Translation File Writer] Existing translations:', existingTranslations)

      // Check for key conflicts
      if (this.hasKeyConflict(entry.key, existingTranslations)) {
        console.warn('[Translation File Writer] Key conflict detected:', entry.key)
        return {
          success: false,
          error: `Translation key '${entry.key}' already exists.`,
        }
      }

      // Add the new translation
      const updatedTranslations = this.addTranslationToObject(entry, existingTranslations)
      // console.log('[Translation File Writer] Updated translations:', updatedTranslations)

      // Write back to file
      await this.writeTranslationFile(translationFile, updatedTranslations)
      // console.log('[Translation File Writer] Successfully wrote to file')

      return {
        success: true,
        filePath: translationFile.fsPath,
        keyAdded: entry.key,
      }
    }
    catch (error) {
      console.error('[Translation File Writer] Error adding translation:', error)
      return {
        success: false,
        error: `Failed to add translation: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Adds multiple translations at once
   */
  async addTranslations(
    entries: TranslationEntry[],
    documentUri: Uri,
  ): Promise<WriteResult[]> {
    const results: WriteResult[] = []

    for (const entry of entries) {
      const result = await this.addTranslation(entry, documentUri)
      results.push(result)

      // Stop on first error to avoid partial updates
      if (!result.success) {
        break
      }
    }

    return results
  }

  /**
   * Gets existing translation keys from the base locale file
   */
  async getExistingKeys(documentUri: Uri): Promise<Set<string>> {
    try {
      const translationFile = await this.findTranslationFile(documentUri)
      if (!translationFile) {
        return new Set()
      }

      const translations = await this.readTranslationFile(translationFile)
      return new Set(this.flattenKeys(translations))
    }
    catch (error) {
      console.debug('[Translation File Writer] Error getting existing keys:', error)
      return new Set()
    }
  }

  /**
   * Finds the base locale translation file based on slang configuration
   */
  private async findTranslationFile(documentUri: Uri): Promise<Uri | null> {
    try {
      // Use the existing ConfigResolver to find slang configuration
      const configFiles = await workspace.findFiles('**/slang.{yml,yaml}', '**/node_modules/**')
      if (configFiles.length === 0) {
        return null
      }

      // Find the closest config file
      const configFile = this.findClosestConfig(documentUri, configFiles)
      const configDir = path.dirname(configFile.fsPath)

      // Parse the configuration to get paths
      const config = await this.parseSlangConfig(configFile)
      if (!config) {
        return null
      }

      // Build the translation file path
      const inputDir = path.join(configDir, config.input_directory || 'i18n')
      const fileName = `${config.base_locale || 'en'}${config.input_file_pattern || '.json'}`
      const translationFilePath = path.join(inputDir, fileName)

      return Uri.file(translationFilePath)
    }
    catch (error) {
      console.debug('[Translation File Writer] Error finding translation file:', error)
      return null
    }
  }

  /**
   * Reads and parses a translation JSON file
   */
  private async readTranslationFile(fileUri: Uri): Promise<any> {
    try {
      const content = await workspace.fs.readFile(fileUri)
      const text = Buffer.from(content).toString('utf8')
      return JSON.parse(text)
    }
    catch (error) {
      // If file doesn't exist, return empty object
      if (error && typeof error === 'object' && 'code' in error && error.code === 'FileNotFound') {
        return {}
      }
      throw error
    }
  }

  /**
   * Writes translations object to JSON file
   */
  private async writeTranslationFile(fileUri: Uri, translations: any): Promise<void> {
    const content = JSON.stringify(translations, null, 2)
    const buffer = Buffer.from(content, 'utf8')

    // Ensure directory exists
    const dir = path.dirname(fileUri.fsPath)
    await workspace.fs.createDirectory(Uri.file(dir))

    await workspace.fs.writeFile(fileUri, buffer)
  }

  /**
   * Checks if a key already exists in the translations object
   */
  private hasKeyConflict(key: string, translations: any): boolean {
    const flatKeys = this.flattenKeys(translations)
    return flatKeys.includes(key)
  }

  /**
   * Adds a translation entry to the translations object
   */
  private addTranslationToObject(entry: TranslationEntry, translations: any): any {
    const result = { ...translations }

    if (entry.nested && entry.parentKey) {
      // Handle nested keys like "settings.title"
      const keyParts = `${entry.parentKey}.${entry.key}`.split('.')
      let current = result

      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i]
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }

      current[keyParts[keyParts.length - 1]] = entry.value
    }
    else {
      // Handle nested keys with dots
      const keyParts = entry.key.includes('.')
        ? entry.key.split('.')
        : [entry.key]

      if (keyParts.length > 1) {
        // Create nested structure
        let current = result

        for (let i = 0; i < keyParts.length - 1; i++) {
          const part = keyParts[i]
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {}
          }
          current = current[part]
        }

        current[keyParts[keyParts.length - 1]] = entry.value
      }
      else {
        // Simple flat key
        result[entry.key] = entry.value
      }
    }

    return result
  }

  /**
   * Flattens nested translation keys into dot notation
   */
  private flattenKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = []

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.flattenKeys(value, fullKey))
      }
      else {
        keys.push(fullKey)
      }
    }

    return keys
  }

  /**
   * Finds the closest config file to the document
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
   * Parses slang.yml configuration file
   */
  private async parseSlangConfig(configFile: Uri): Promise<any | null> {
    try {
      const content = await workspace.fs.readFile(configFile)
      const text = Buffer.from(content).toString('utf8')

      // console.log('[Translation File Writer] Parsing config file:', configFile.fsPath)
      // console.log('[Translation File Writer] Config content:', text)

      // Use proper YAML parsing
      const config = yaml.load(text) as any

      // console.log('[Translation File Writer] Parsed config:', config)

      return config
    }
    catch (error) {
      console.error('[Translation File Writer] Error parsing slang config:', error)
      return null
    }
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
   * Shows a success message to the user
   */
  async showSuccessMessage(result: WriteResult): Promise<void> {
    if (result.success && result.keyAdded) {
      const message = `Translation key '${result.keyAdded}' added successfully!`
      window.showInformationMessage(message)
    }
  }

  /**
   * Shows an error message to the user
   */
  async showErrorMessage(result: WriteResult): Promise<void> {
    if (!result.success && result.error) {
      window.showErrorMessage(`Failed to add translation: ${result.error}`)
    }
  }
}
