import type { Uri } from 'vscode'
import { workspace } from 'vscode'

export class CommentResolver {
  private cache = new Map<string, Map<string, string>>()

  /**
   * Resolves translation string from comments in generated Dart files
   */
  async resolveFromComments(variableName: string, documentUri: Uri): Promise<string | null> {
    try {
      // Find the corresponding strings.g.dart file
      const generatedFile = await this.findGeneratedFileForDocument(documentUri)
      if (!generatedFile) {
        return null
      }

      // Get cached results if available
      const cacheKey = generatedFile.toString()
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        return cached.get(variableName) || null
      }

      // Parse the generated file for comment patterns
      const translations = await this.parseGeneratedFile(generatedFile)
      this.cache.set(cacheKey, translations)

      return translations.get(variableName) || null
    }
    catch (error) {
      console.debug('[Comment Resolver] Error resolving from comments:', error)
      return null
    }
  }

  /**
   * Finds the strings.g.dart file for a given document
   */
  private async findGeneratedFileForDocument(documentUri: Uri): Promise<Uri | null> {
    try {
      // Look for strings.g.dart files in the workspace
      const generatedFiles = await workspace.findFiles('**/strings.g.dart', '**/node_modules/**')
      
      if (generatedFiles.length === 0) {
        return null
      }

      // If only one file, use it
      if (generatedFiles.length === 1) {
        return generatedFiles[0]
      }

      // Try to find the closest one to the current document
      const documentPath = documentUri.fsPath
      let bestMatch: Uri | null = null
      let shortestDistance = Infinity

      for (const file of generatedFiles) {
        const filePath = file.fsPath
        // Simple heuristic: find common path prefix length
        const commonLength = this.getCommonPathLength(documentPath, filePath)
        const distance = Math.abs(documentPath.length - commonLength) + Math.abs(filePath.length - commonLength)
        
        if (distance < shortestDistance) {
          shortestDistance = distance
          bestMatch = file
        }
      }

      return bestMatch
    }
    catch (error) {
      console.debug('[Comment Resolver] Error finding generated file:', error)
      return null
    }
  }

  /**
   * Parses a strings.g.dart file to extract translation strings from comments
   */
  private async parseGeneratedFile(fileUri: Uri): Promise<Map<string, string>> {
    const translations = new Map<string, string>()

    try {
      const content = await workspace.fs.readFile(fileUri)
      const text = Buffer.from(content).toString('utf8')
      const lines = text.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for comment pattern: /// en: 'translation text'
        const commentMatch = line.match(/^\/\/\/\s*(\w+):\s*['"`](.+?)['"`]\s*$/)
        if (commentMatch) {
          const [, locale, translationText] = commentMatch
          
          // Look for the next line with the variable declaration
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim()
            const variableMatch = nextLine.match(/String\s+get\s+(\w+)\s*=>/)
            
            if (variableMatch) {
              const [, variableName] = variableMatch
              // For now, we'll use the first locale found (typically 'en')
              if (locale === 'en' || !translations.has(variableName)) {
                translations.set(variableName, translationText)
              }
            }
          }
        }

        // Alternative pattern: multiline comments
        if (line.startsWith('///') && line.includes(':')) {
          const multilineMatch = line.match(/^\/\/\/\s*(\w+):\s*['"`](.+?)['"`]?\s*$/)
          if (multilineMatch) {
            const [, locale, translationText] = multilineMatch
            
            // Look ahead for variable declaration
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const searchLine = lines[j].trim()
              if (searchLine.includes('String get')) {
                const variableMatch = searchLine.match(/String\s+get\s+(\w+)\s*=>/)
                if (variableMatch) {
                  const [, variableName] = variableMatch
                  if (locale === 'en' || !translations.has(variableName)) {
                    translations.set(variableName, translationText)
                  }
                  break
                }
              }
            }
          }
        }
      }
    }
    catch (error) {
      console.debug('[Comment Resolver] Error parsing generated file:', error)
    }

    return translations
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
        commonLength += parts1[i].length + 1 // +1 for separator
      } else {
        break
      }
    }

    return commonLength
  }

  /**
   * Clears the cache (useful for testing or when files change)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { entries: number, keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}