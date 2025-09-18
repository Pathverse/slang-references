import type { CancellationToken, HoverProvider, Position, ProviderResult, TextDocument } from 'vscode'
import { Hover, languages, MarkdownString, Range } from 'vscode'
import { SlangDetector } from '../detectors/slangDetector'
import { CommentResolver } from '../resolvers/commentResolver'
import { ConfigResolver } from '../resolvers/configResolver'

export class SlangHoverProvider implements HoverProvider {
  private slangDetector: SlangDetector
  private commentResolver: CommentResolver
  private configResolver: ConfigResolver

  constructor() {
    this.slangDetector = new SlangDetector()
    this.commentResolver = new CommentResolver()
    this.configResolver = new ConfigResolver()
  }

  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ): Promise<Hover | null> {
    try {
      // Check if we're hovering over a Slang translation variable
      const detection = await this.slangDetector.detectSlangVariable(document, position)
      if (!detection) {
        return null
      }

      // Try to resolve the translation string
      let translationString: string | null = null

      // First try: Extract from comments in generated files
      translationString = await this.commentResolver.resolveFromComments(
        detection.variableName,
        document.uri,
      )

      // Second try: Use configuration-based resolution
      if (!translationString) {
        translationString = await this.configResolver.resolveFromConfig(
          detection.variableName,
          document.uri,
        )
      }

      if (!translationString) {
        return null
      }

      // Create hover content
      const markdown = new MarkdownString()
      markdown.isTrusted = true
      markdown.appendCodeblock(translationString, 'text')
      
      // Add metadata if enabled in settings
      const config = await import('vscode').then(vscode => vscode.workspace.getConfiguration('slangReferences'))
      if (config.get('showDetailedInfo', false)) {
        markdown.appendText(`\n\n**Variable:** \`${detection.variableName}\``)
        markdown.appendText(`\n**Type:** Slang Translation`)
      }

      return new Hover(markdown, new Range(position, position))
    }
    catch (error) {
      // Fail silently to not disrupt development flow
      console.debug('[Slang References] Hover error:', error)
      return null
    }
  }
}

export function registerSlangHoverProvider(): void {
  const provider = new SlangHoverProvider()
  
  // Register for Dart files
  languages.registerHoverProvider(
    { scheme: 'file', language: 'dart' },
    provider,
  )
}