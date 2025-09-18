import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  commands,
  languages,
  Range,
  Selection,
  TextDocument,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode'
import { StringLiteralDetector } from '../detectors/stringLiteralDetector'
import { KeyGenerator } from '../utils/keyGenerator'
import { TranslationFileWriter, TranslationEntry } from '../utils/translationFileWriter'

export class StringToTranslationCodeActionProvider implements CodeActionProvider {
  private stringLiteralDetector: StringLiteralDetector
  private translationWriter: TranslationFileWriter

  constructor() {
    this.stringLiteralDetector = new StringLiteralDetector()
    this.translationWriter = new TranslationFileWriter()
  }

  async provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
  ): Promise<CodeAction[]> {
    try {
      const actions: CodeAction[] = []

      // Check if we're on a string literal
      const detection = await this.stringLiteralDetector.detectStringLiteral(
        document,
        range.start,
      )

      if (!detection) {
        return actions
      }

      // Generate key suggestions
      const keySuggestions = KeyGenerator.generateKeySuggestions(detection.value)
      const existingKeys = await this.translationWriter.getExistingKeys(document.uri)

      // Create code actions for each key suggestion
      for (const suggestedKey of keySuggestions.slice(0, 3)) { // Limit to 3 suggestions
        const uniqueKey = KeyGenerator.generateUniqueKey(suggestedKey, existingKeys)
        
        const action = new CodeAction(
          `Convert to translation: t.${uniqueKey}`,
          CodeActionKind.RefactorRewrite,
        )
        
        // Use command instead of workspace edit to ensure only selected action executes
        action.command = {
          command: 'slangReferences.convertToTranslation',
          title: `Convert to translation: t.${uniqueKey}`,
          arguments: [document.uri, detection, uniqueKey, detection.value],
        }
        
        action.isPreferred = keySuggestions.indexOf(suggestedKey) === 0 // First suggestion is preferred
        
        actions.push(action)
      }

      // Add a "Custom key..." option
      const customAction = new CodeAction(
        'Convert to translation with custom key...',
        CodeActionKind.RefactorRewrite,
      )
      
      customAction.command = {
        command: 'slangReferences.convertToTranslationWithCustomKey',
        title: 'Convert to translation with custom key',
        arguments: [document.uri, detection],
      }
      
      actions.push(customAction)

      return actions
    }
    catch (error) {
      console.debug('[String to Translation Code Action] Error providing code actions:', error)
      return []
    }
  }

  /**
   * Handles the conversion with a custom key name
   */
  async convertToTranslationWithCustomKey(documentUri: any, detection: any): Promise<void> {
    try {
      // Show input box for custom key
      const customKey = await window.showInputBox({
        prompt: 'Enter custom translation key',
        value: KeyGenerator.generateKey(detection.value),
        validateInput: (value) => {
          const validation = KeyGenerator.validateKey(value)
          return validation.isValid ? undefined : validation.errors.join(', ')
        },
      })

      if (!customKey) {
        return // User cancelled
      }

      // Check for conflicts
      const existingKeys = await this.translationWriter.getExistingKeys(documentUri)
      if (existingKeys.has(customKey)) {
        const overwrite = await window.showWarningMessage(
          `Translation key '${customKey}' already exists. Overwrite?`,
          'Yes',
          'No',
        )
        
        if (overwrite !== 'Yes') {
          return
        }
      }

      // Apply the conversion
      await this.applyConversion(documentUri, detection, customKey, detection.value)
    }
    catch (error) {
      console.error('[String to Translation Code Action] Error with custom key conversion:', error)
      window.showErrorMessage(`Failed to convert to translation: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Applies the conversion by updating both the code and translation file
   */
  async applyConversion(
    documentUri: any,
    detection: any,
    key: string,
    value: string,
  ): Promise<void> {
    try {
      console.log('[String to Translation] Starting conversion:', { key, value })
      
      // First, add the translation to the file
      const translationEntry: TranslationEntry = {
        key,
        value,
      }

      const writeResult = await this.translationWriter.addTranslation(translationEntry, documentUri)
      
      if (!writeResult.success) {
        window.showErrorMessage(`Failed to add translation: ${writeResult.error}`)
        return
      }

      // Then, replace the string literal in the code
      const edit = new WorkspaceEdit()
      edit.replace(documentUri, detection.range, `t.${key}`)
      
      const success = await workspace.applyEdit(edit)
      
      if (success) {
        // Show success message
        await this.translationWriter.showSuccessMessage(writeResult)
        console.log('[String to Translation] Conversion completed successfully')
      } else {
        window.showErrorMessage('Failed to update the code')
      }
    }
    catch (error) {
      console.error('[String to Translation Code Action] Error applying conversion:', error)
      window.showErrorMessage(`Failed to apply conversion: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Registers the string to translation code action provider
 */
export function registerStringToTranslationProvider(): void {
  const provider = new StringToTranslationCodeActionProvider()
  
  // Register the code action provider for Dart files
  languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'dart' },
    provider,
    {
      providedCodeActionKinds: [CodeActionKind.RefactorRewrite],
    },
  )

  // Register commands for conversions
  commands.registerCommand(
    'slangReferences.convertToTranslation',
    (documentUri: any, detection: any, key: string, value: string) => 
      provider.applyConversion(documentUri, detection, key, value),
  )
  
  commands.registerCommand(
    'slangReferences.convertToTranslationWithCustomKey',
    (documentUri: any, detection: any) => provider.convertToTranslationWithCustomKey(documentUri, detection),
  )
}