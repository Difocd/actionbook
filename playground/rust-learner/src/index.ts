import 'dotenv/config'
import { generateText, stepCountIs, StepResult } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { chromium } from 'playwright'
import { ProxyAgent, fetch as undiciFetch } from 'undici'

// Setup proxy if configured
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
if (proxyUrl) {
  console.log(`🌐 Using proxy: ${proxyUrl}`)
}

const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined

const openai = createOpenAI({
  fetch: proxyAgent
    ? (input, init) => undiciFetch(input, { ...init, dispatcher: proxyAgent })
    : undefined,
})
import { createBrowserTools } from './tools/browser.js'
import { parsePageContent, generateLearningReport } from './parsers/releases-parser.js'
import type { RustRelease, LearningReport } from './types/rust-release.js'

const MODEL = 'gpt-4o'

const SYSTEM_PROMPT = `You are a Rust learning assistant that helps users learn about Rust language features from releases.rs.

## Available Tools

### Browser Tools
- **navigate**: Navigate to a URL
- **getPageContent**: Extract structured content from the current page (version, categories, features)
- **getVersionList**: Get list of available Rust versions from the sidebar
- **click**: Click on an element using CSS selector
- **pageInfo**: Get current page URL and title

## Workflow

1. **Navigate to releases.rs**: Go to https://releases.rs
2. **Get version list**: Use getVersionList to see available versions
3. **Navigate to specific version**: Either navigate to the latest stable or a specific version requested by user
4. **Extract content**: Use getPageContent to get the release features
5. **Return the data**: Return the extracted content for report generation

## Important Notes

- Always start by navigating to releases.rs
- The page structure differs between stable and nightly releases:
  - Stable: Has H2 sections (Language, Compiler, Libraries, etc.)
  - Nightly: Flat list of changes without categories
- Use the getPageContent tool to extract structured data
- Return a summary of what you found
`

interface PageContentData {
  version: string
  releaseInfo: string
  isStable: boolean
  categories: Array<{
    name: string
    items: Array<{ text: string; href: string | null }>
  }>
}

async function main() {
  // Get task from command line or use default
  const userInput = process.argv.slice(2).join(' ')
  const task =
    userInput ||
    'Go to releases.rs and get the features of the latest stable Rust version'

  console.log(`\n🦀 Rust Learner Agent`)
  console.log(`📋 Task: ${task}\n`)

  // Launch browser
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })

  const page = await context.newPage()

  try {
    // Create browser tools
    const tools = createBrowserTools(page)

    // Run the agent
    console.log('🤖 Starting AI agent...\n')

    let extractedData: PageContentData | null = null

    const result = await generateText({
      model: openai(MODEL),
      system: SYSTEM_PROMPT,
      prompt: task,
      tools,
      stopWhen: stepCountIs(15),
      onStepFinish(event: StepResult<typeof tools>) {
        const { toolCalls, toolResults, text } = event
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            console.log(`🔧 Tool: ${toolCall.toolName}`)
            const inputStr = JSON.stringify(toolCall.args || {})
            if (inputStr && inputStr.length > 100) {
              console.log(`   Input: ${inputStr.slice(0, 100)}...`)
            } else if (inputStr) {
              console.log(`   Input: ${inputStr}`)
            }
          }
        }
        if (toolResults && toolResults.length > 0) {
          for (const toolResult of toolResults) {
            const output = toolResult.result as Record<string, unknown>
            const outputStr = JSON.stringify(output) || ''
            const preview = outputStr.slice(0, 150)
            console.log(
              `   Output: ${preview}${outputStr.length > 150 ? '...' : ''}`
            )

            // Capture page content data for report generation
            if (
              output &&
              typeof output === 'object' &&
              'success' in output &&
              output.success &&
              'data' in output
            ) {
              const data = output.data as PageContentData
              if (data && 'version' in data && 'categories' in data) {
                extractedData = data
              }
            }
          }
        }
        if (text) {
          console.log(`\n💬 ${text}\n`)
        }
      },
    })

    console.log('\n✅ Agent completed!')
    console.log(`📊 Steps: ${result.steps.length}`)

    // Generate learning report if we have data
    if (extractedData) {
      console.log('\n📝 Generating learning report...\n')

      const release = parsePageContent(extractedData)
      const markdown = generateLearningReport(release)

      const report: LearningReport = {
        fetchedAt: new Date().toISOString(),
        release,
        summary: result.text,
        markdown,
      }

      console.log('━'.repeat(60))
      console.log(markdown)
      console.log('━'.repeat(60))

      // Print stats
      const totalFeatures = release.categories.reduce(
        (sum, cat) => sum + cat.features.length,
        0
      )
      console.log(`\n📈 Stats:`)
      console.log(`   Version: ${release.version}`)
      console.log(`   Status: ${release.isStable ? 'Stable' : 'Nightly/Beta'}`)
      console.log(`   Total features: ${totalFeatures}`)
      console.log(`   Categories: ${release.categories.length}`)
    } else {
      console.log('\n⚠️ Could not extract page content. Agent response:')
      console.log(result.text)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
