import { defineExtension } from 'reactive-vscode'
import { window } from 'vscode'
import { registerSlangHoverProvider } from './providers/hoverProvider'

const { activate, deactivate } = defineExtension(() => {
  // Register the Slang hover provider
  registerSlangHoverProvider()
  
  // Optional: Show activation message in development
  if (process.env.NODE_ENV === 'development') {
    window.showInformationMessage('Slang References extension activated')
  }
})

export { activate, deactivate }
