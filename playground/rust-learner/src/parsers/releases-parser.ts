import type { RustRelease, RustCategory, RustFeature } from '../types/rust-release.js'

/**
 * Parse page content data into RustRelease structure
 */
export function parsePageContent(data: {
  version: string
  releaseInfo: string
  isStable: boolean
  categories: Array<{
    name: string
    items: Array<{ text: string; href: string | null }>
  }>
}): RustRelease {
  // Parse release info to extract dates
  const releaseDateMatch = data.releaseInfo.match(/Released on:\s*(.+?)(?:\s|$)/i)
  const branchedDateMatch = data.releaseInfo.match(/Branched from master on:\s*(.+?)(?:\s|$)/i)
  const expectedStableMatch = data.releaseInfo.match(/Will be stable on:\s*(.+?)(?:\s|$)/i)

  // Convert raw categories to typed categories
  const categories: RustCategory[] = data.categories.map((cat) => ({
    name: cat.name,
    features: cat.items.map((item) => parseFeatureItem(item)),
  }))

  return {
    version: data.version,
    isStable: data.isStable,
    releaseDate: releaseDateMatch?.[1]?.trim(),
    branchedDate: branchedDateMatch?.[1]?.trim(),
    expectedStableDate: expectedStableMatch?.[1]?.trim(),
    categories,
  }
}

/**
 * Parse a single feature item
 */
function parseFeatureItem(item: { text: string; href: string | null }): RustFeature {
  // Check for merged time (nightly format)
  const mergedMatch = item.text.match(/\(merged (.+?)\)/)

  // Clean the title
  let title = item.text
  if (mergedMatch) {
    title = title.replace(mergedMatch[0], '').trim()
  }

  return {
    title,
    url: item.href || undefined,
    mergedAgo: mergedMatch?.[1],
  }
}

/**
 * Generate a markdown learning report from a RustRelease
 */
export function generateLearningReport(release: RustRelease): string {
  const lines: string[] = []

  // Title
  lines.push(`# Rust ${release.version} Learning Guide`)
  lines.push('')

  // Status and dates
  if (release.isStable) {
    lines.push(`> **Stable Release**`)
    if (release.releaseDate) {
      lines.push(`> Released on: ${release.releaseDate}`)
    }
  } else {
    lines.push(`> **Nightly/Beta Release**`)
    if (release.expectedStableDate) {
      lines.push(`> Expected stable on: ${release.expectedStableDate}`)
    }
  }
  lines.push('')

  // Summary stats
  const totalFeatures = release.categories.reduce(
    (sum, cat) => sum + cat.features.length,
    0
  )
  lines.push(`## Summary`)
  lines.push('')
  lines.push(`This release includes **${totalFeatures} changes** across ${release.categories.length} categories:`)
  lines.push('')
  for (const cat of release.categories) {
    lines.push(`- **${cat.name}**: ${cat.features.length} changes`)
  }
  lines.push('')

  // Detailed categories
  for (const category of release.categories) {
    lines.push(`## ${category.name}`)
    lines.push('')

    for (const feature of category.features) {
      if (feature.url) {
        lines.push(`- [${feature.title}](${feature.url})`)
      } else {
        lines.push(`- ${feature.title}`)
      }
      if (feature.mergedAgo) {
        lines.push(`  *(merged ${feature.mergedAgo})*`)
      }
    }
    lines.push('')
  }

  // Footer
  lines.push('---')
  lines.push(`*Generated from [releases.rs](https://releases.rs/docs/${release.version}/)*`)

  return lines.join('\n')
}
