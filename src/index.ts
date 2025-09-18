import { defineExtension } from 'reactive-vscode'
import { window, workspace } from 'vscode'
import { registerSlangHoverProvider } from './providers/hoverProvider'
import { registerStringToTranslationProvider } from './providers/stringToTranslationProvider'

const { activate, deactivate } = defineExtension(() => {
  // Register the Slang hover provider
  registerSlangHoverProvider()
  
  // Register the string to translation conversion provider
  const config = workspace.getConfiguration('slangReferences')
  if (config.get('stringToTranslation.enabled', true)) {
    registerStringToTranslationProvider()
  }
  
  // Optional: Show activation message in development
  if (process.env.NODE_ENV === 'development') {
    window.showInformationMessage('Slang References extension activated with string conversion feature')
  }
})

export { activate, deactivate }
