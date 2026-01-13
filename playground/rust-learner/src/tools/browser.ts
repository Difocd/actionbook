import { tool } from 'ai'
import { z } from 'zod'
import type { Page, Browser } from 'playwright'

/**
 * Create browser automation tools for AI Agent
 */
export function createBrowserTools(page: Page) {
  return {
    /**
     * Navigate to a URL
     */
    navigate: tool({
      description: 'Navigate to a specific URL in the browser',
      inputSchema: z.object({
        url: z.string().url().describe('The URL to navigate to'),
      }),
      execute: async ({ url }) => {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded' })
          const currentUrl = page.url()
          const title = await page.title()
          return {
            success: true,
            url: currentUrl,
            title,
            message: `Navigated to ${currentUrl}`,
          }
        } catch (error) {
          return {
            success: false,
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      },
    }),

    /**
     * Get page content as structured text
     */
    getPageContent: tool({
      description:
        'Get the main content of the current page. Returns structured text with headings, lists, and links.',
      inputSchema: z.object({
        selector: z
          .string()
          .optional()
          .describe(
            'CSS selector to extract content from. Defaults to main article.'
          ),
      }),
      execute: async ({ selector }) => {
        try {
          const targetSelector = selector || 'article.markdown.book-article'

          // Extract structured content from the page
          const content = await page.evaluate((sel) => {
            const article = document.querySelector(sel)
            if (!article) return null

            // Get version title from h1
            const h1 = article.querySelector('h1')
            const version = h1?.textContent?.replace(/#/g, '').trim() || ''

            // Get release info from blockquote
            const blockquote = article.querySelector('blockquote.book-hint')
            const releaseInfo =
              blockquote?.textContent?.replace(/\s+/g, ' ').trim() || ''

            // Check if stable (has h2 sections) or nightly (flat list)
            const h2Elements = article.querySelectorAll('h2')
            const isStable = h2Elements.length > 0

            interface Category {
              name: string
              items: { text: string; href: string | null }[]
            }

            const categories: Category[] = []

            if (isStable) {
              // Parse stable release with categories
              h2Elements.forEach((h2) => {
                const categoryName =
                  h2.textContent?.replace(/#/g, '').trim() || ''
                const items: { text: string; href: string | null }[] = []

                // Get the ul that follows this h2
                let nextEl = h2.nextElementSibling
                while (nextEl && nextEl.tagName !== 'H2') {
                  if (nextEl.tagName === 'UL') {
                    nextEl.querySelectorAll('li').forEach((li) => {
                      const link = li.querySelector('a')
                      items.push({
                        text: li.textContent?.trim() || '',
                        href: link?.getAttribute('href') || null,
                      })
                    })
                    break
                  }
                  nextEl = nextEl.nextElementSibling
                }

                if (items.length > 0) {
                  categories.push({ name: categoryName, items })
                }
              })
            } else {
              // Parse nightly release with flat list
              const ul = article.querySelector(
                'blockquote.book-hint + ul, blockquote + ul'
              )
              if (ul) {
                const items: { text: string; href: string | null }[] = []
                ul.querySelectorAll('li').forEach((li) => {
                  const link = li.querySelector('a')
                  items.push({
                    text: li.textContent?.trim() || '',
                    href: link?.getAttribute('href') || null,
                  })
                })
                categories.push({ name: 'Changes', items })
              }
            }

            return {
              version,
              releaseInfo,
              isStable,
              categories,
            }
          }, targetSelector)

          if (!content) {
            return {
              success: false,
              error: `Could not find content with selector: ${targetSelector}`,
            }
          }

          return { success: true, data: content }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      },
    }),

    /**
     * Click on an element
     */
    click: tool({
      description: 'Click on an element using a CSS selector',
      inputSchema: z.object({
        selector: z.string().describe('CSS selector of the element to click'),
      }),
      execute: async ({ selector }) => {
        try {
          await page.click(selector, { timeout: 5000 })
          return {
            success: true,
            message: `Clicked on ${selector}`,
          }
        } catch (error) {
          return {
            success: false,
            selector,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      },
    }),

    /**
     * Get list of version links from sidebar
     */
    getVersionList: tool({
      description:
        'Get the list of available Rust versions from the sidebar navigation',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const versions = await page.evaluate(() => {
            const links = document.querySelectorAll(
              'aside.book-menu nav > ul > li > a'
            )
            return Array.from(links).map((a) => ({
              version: a.textContent?.trim() || '',
              href: a.getAttribute('href') || '',
            }))
          })

          return {
            success: true,
            versions,
            latestStable: versions.find((v) => !v.version.includes('nightly')),
            latestNightly: versions.find((v) => v.version.includes('nightly')),
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      },
    }),

    /**
     * Get current page info
     */
    pageInfo: tool({
      description: 'Get information about the current page (URL and title)',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const url = page.url()
          const title = await page.title()
          return { success: true, url, title }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      },
    }),
  }
}
