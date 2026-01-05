/**
 * TaskExecutor - Task Executor (Full Version with ActionBuilder Integration)
 *
 * Uses ActionBuilder to execute recording tasks, supporting dual-mode Prompts:
 * - task_driven: Task-driven mode (uses interact tool)
 * - exploratory: Exploratory mode (uses register_element tool)
 *
 * Flow:
 * 1. Fetch ChunkData from database (JOIN chunks, documents, sources)
 * 2. Use prompt-builder to construct mode-specific Prompt
 * 3. Call ActionBuilder.build() for multi-turn LLM conversation and element recording
 * 4. Update task status (completed/failed)
 * 5. Return ExecutionResult (includes actions_created, turns, tokens, etc.)
 */

import {
  type Database,
  type RecordingTaskStatus,
  recordingTasks,
  chunks,
  documents,
  sources,
  eq,
} from '@actionbookdev/db'
import { ActionBuilder } from '../ActionBuilder.js'
import { DbWriter } from '../writers/DbWriter.js'
import { buildPrompt } from './utils/prompt-builder.js'
import type {
  RecordingTask,
  ExecutionResult,
  TaskExecutorConfig,
  ChunkType,
} from './types/index.js'

/**
 * Extended ChunkData type, includes source information
 */
interface ExtendedChunkData {
  id: number
  document_id: number
  source_id: number
  document_url: string
  document_title: string
  source_domain: string
  source_name: string
  source_base_url: string
  /** App/Product URL for action building (optional, if not set LLM will infer) */
  source_app_url: string | null
  source_description: string
  chunk_content: string
  chunk_index: number
  createdAt: Date
}

export class TaskExecutor {
  private config: TaskExecutorConfig
  private dbWriter: DbWriter
  private buildTimeoutMs: number

  constructor(private db: Database, config: TaskExecutorConfig) {
    this.config = {
      headless: config.headless ?? true,
      maxTurns: config.maxTurns ?? 30,
      outputDir: config.outputDir ?? './output',
      taskTimeoutMinutes: config.taskTimeoutMinutes ?? 10,
      ...config,
    }
    // Use taskTimeoutMinutes for overall timeout (including init, build, cleanup)
    this.buildTimeoutMs = (this.config.taskTimeoutMinutes ?? 10) * 60 * 1000
    this.dbWriter = new DbWriter(db)
  }

  /**
   * Check if an error is retryable (browser/connection errors)
   */
  private isRetryableError(error: Error | string): boolean {
    const errorMsg = typeof error === 'string' ? error : error.message
    const retryablePatterns = [
      'ECONNREFUSED',        // Connection refused
      'Target closed',       // Browser target closed
      'Browser closed',      // Browser instance closed
      'Connection closed',   // CDP connection closed
      'Protocol error',      // CDP protocol error
      'Session closed',      // Browser session closed
      'ECONNRESET',          // Connection reset
      'socket hang up',      // Socket disconnected
    ]

    return retryablePatterns.some(pattern => errorMsg.includes(pattern))
  }

  /**
   * Execute recording task with automatic retry for browser/connection errors
   *
   * @param task - Recording task to execute
   * @returns Execution result
   */
  async execute(task: RecordingTask): Promise<ExecutionResult> {
    const maxRetries = 3
    const baseRetryDelay = 2000 // 2 seconds base delay

    // Validate chunkId (non-retryable error)
    if (task.chunkId === null || task.chunkId === undefined) {
      await this.updateTaskStatus(task.id, {
        status: 'failed',
        errorMessage: 'Chunk ID is required',
        attemptCount: task.attemptCount + 1,
      })
      return {
        success: false,
        actions_created: 0,
        error: 'Chunk ID is required',
        duration_ms: 0,
      }
    }

    // Fetch ChunkData (non-retryable error)
    let chunkData: ExtendedChunkData
    try {
      chunkData = await this.fetchChunkData(task.chunkId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      await this.updateTaskStatus(task.id, {
        status: 'failed',
        errorMessage,
        attemptCount: task.attemptCount + 1,
      })
      return {
        success: false,
        actions_created: 0,
        error: errorMessage,
        duration_ms: 0,
      }
    }

    // Retry loop for browser/connection errors
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[TaskExecutor] Executing task #${task.id} (attempt ${attempt}/${maxRetries})`
        )

        // Execute the task
        const result = await this.executeInternal(task, chunkData)

        // Success - return result
        if (attempt > 1) {
          console.log(
            `[TaskExecutor] Task ${task.id} succeeded on attempt ${attempt}/${maxRetries}`
          )
        }
        return result

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const isRetryable = this.isRetryableError(error as Error)

        if (isRetryable && attempt < maxRetries) {
          // Retryable error and not last attempt - retry with exponential backoff
          const retryDelay = baseRetryDelay * attempt
          console.warn(
            `[TaskExecutor] Task ${task.id} failed with retryable error on attempt ${attempt}/${maxRetries}: ${errorMessage}`
          )
          console.log(
            `[TaskExecutor] Retrying in ${retryDelay}ms...`
          )

          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue // Retry
        }

        // Non-retryable error or last attempt failed
        // Mark task as failed and return error result
        if (isRetryable) {
          console.error(
            `[TaskExecutor] Task ${task.id} failed after ${maxRetries} attempts with retryable error: ${errorMessage}`
          )
        } else {
          console.error(
            `[TaskExecutor] Task ${task.id} failed with non-retryable error: ${errorMessage}`
          )
        }

        // Update task status to failed
        await this.updateTaskStatus(task.id, {
          status: 'failed',
          errorMessage,
          attemptCount: task.attemptCount + 1,
        })

        return {
          success: false,
          actions_created: 0,
          error: errorMessage,
          duration_ms: 0,
        }
      }
    }

    // Should never reach here, but TypeScript needs a return
    throw new Error('Unexpected: retry loop completed without result')
  }

  /**
   * Internal execution logic (called by execute with retry wrapper)
   */
  private async executeInternal(
    task: RecordingTask,
    chunkData: ExtendedChunkData
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    // Log task context information
    console.log(
      `[TaskExecutor] Executing task #${task.id}: ` +
        `source_id=${chunkData.source_id}, ` +
        `document_id=${chunkData.document_id}, ` +
        `chunk_id=${chunkData.id}, ` +
        `name="${chunkData.source_name}", ` +
        `url="${chunkData.document_url}"`
    )

    // Create ActionBuilder instance
    const builder = new ActionBuilder({
      llmApiKey: this.config.llmApiKey,
      llmBaseURL: this.config.llmBaseURL,
      llmModel: this.config.llmModel,
      databaseUrl: this.config.databaseUrl,
      headless: this.config.headless,
      maxTurns: this.config.maxTurns,
      outputDir: this.config.outputDir,
      profileEnabled: this.config.profileEnabled,
      profileDir: this.config.profileDir,
    })

    // Set up overall task timeout
    const taskTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Task execution timeout after ${this.buildTimeoutMs / 1000 / 60} minutes`
          )
        )
      }, this.buildTimeoutMs)
    })

    try {
      // Wrap entire task execution with timeout protection
      const executionPromise = (async () => {
        // Initialize browser
        await builder.initialize()

        // Build Prompt
        const chunkType = (task.config?.chunk_type as ChunkType) || 'exploratory'
        const { systemPrompt, userPrompt } = this.buildCustomPrompts(
          chunkData,
          chunkType
        )

        // Generate scenario name
        const scenarioName = `task_${task.id}_${Date.now()}`

        // Use root domain of source.base_url as start URL
        // e.g., https://notion.com/help → https://notion.com
        const startUrl = new URL(chunkData.source_base_url).origin

        // Call ActionBuilder.build()
        const buildResult = await builder.build(startUrl, scenarioName, {
          siteName: chunkData.source_name,
          customSystemPrompt: systemPrompt,
          customUserPrompt: userPrompt,
          taskId: task.id, // Pass existing task ID to avoid duplicate task creation
        })

        return buildResult
      })()

      const buildResult = await Promise.race([executionPromise, taskTimeoutPromise])

      if (buildResult.success) {
        // Success: count elements
        const actionsCreated = this.countElements(buildResult.siteCapability)

        // Update chunks.elements field with discovered elements
        if (task.chunkId && buildResult.siteCapability && actionsCreated > 0) {
          try {
            await this.dbWriter.updateChunkElements(
              task.chunkId,
              buildResult.siteCapability
            )
          } catch (chunkUpdateError) {
            // Log but don't fail the task if chunk update fails
            console.warn(
              `[TaskExecutor] Failed to update chunk elements for chunk ${task.chunkId}:`,
              chunkUpdateError
            )
          }
        }

        // Update task status to completed
        await this.updateTaskStatus(task.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          attemptCount: task.attemptCount + 1,
        })

        const duration = Date.now() - startTime
        return {
          success: true,
          actions_created: actionsCreated,
          duration_ms: duration,
          turns: buildResult.turns || 0,
          tokens_used: buildResult.tokens?.total || 0,
          saved_path: buildResult.savedPath,
        }
      } else {
        // ActionBuilder returned failure
        const errorMessage = `Recording failed: ${buildResult.message}`
        await this.updateTaskStatus(task.id, {
          status: 'failed',
          errorMessage,
          attemptCount: task.attemptCount + 1,
        })

        const duration = Date.now() - startTime
        return {
          success: false,
          actions_created: 0,
          error: errorMessage,
          duration_ms: duration,
          turns: buildResult.turns || 0,
          tokens_used: buildResult.tokens?.total || 0,
        }
      }
    } catch (error) {
      // Execution exception - print full stack trace for debugging
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined

      console.error(
        `[TaskExecutor] Task ${task.id} failed with error:`,
        errorMessage
      )
      if (errorStack) {
        console.error(`[TaskExecutor] Stack trace:\n${errorStack}`)
      }

      // Check if this is a timeout error - attempt to save partial results
      // Timeout is NOT retryable, handle it specially
      if (errorMessage.includes('timeout')) {
        console.log(
          `[TaskExecutor] Timeout detected for task ${task.id}, attempting to save partial results...`
        )

        try {
          const partialResult = await builder.savePartialResult()

          if (partialResult && partialResult.elements > 0) {
            // Partial save succeeded - mark as completed with timeout note
            console.log(
              `[TaskExecutor] Successfully saved ${partialResult.elements} elements for task ${task.id} despite timeout`
            )
            console.log(
              `[TaskExecutor] Timeout statistics - turns: ${partialResult.turns}, steps: ${partialResult.steps}, tokens: ${partialResult.tokens.total}`
            )

            // Update chunks.elements field with discovered elements
            if (task.chunkId && partialResult.siteCapability) {
              try {
                await this.dbWriter.updateChunkElements(
                  task.chunkId,
                  partialResult.siteCapability
                )
                console.log(
                  `[TaskExecutor] Updated chunk ${task.chunkId} with ${partialResult.elements} elements`
                )
              } catch (chunkUpdateError) {
                console.warn(
                  `[TaskExecutor] Failed to update chunk elements for chunk ${task.chunkId}:`,
                  chunkUpdateError
                )
              }
            }

            await this.updateTaskStatus(task.id, {
              status: 'completed',
              progress: 100,
              errorMessage: `Timeout after ${this.buildTimeoutMs / 1000 / 60}min, saved ${partialResult.elements} elements`,
              completedAt: new Date(),
              attemptCount: task.attemptCount + 1,
            })

            const duration = Date.now() - startTime
            return {
              success: true,
              actions_created: partialResult.elements,
              error: `timeout_partial_save: ${errorMessage}`,
              duration_ms: duration,
              turns: partialResult.turns,
              tokens_used: partialResult.tokens.total,
            }
          } else {
            console.warn(
              `[TaskExecutor] No elements to save for task ${task.id} after timeout`
            )
          }
        } catch (saveError) {
          console.error(
            `[TaskExecutor] Failed to save partial result for task ${task.id}:`,
            saveError
          )
        }
      }

      // Re-throw error to be handled by retry logic in execute()
      // Don't update task status here - let the retry handler decide
      throw error
    } finally {
      // Ensure browser is closed
      await builder.close()
    }
  }

  /**
   * Fetch ChunkData from database (JOIN chunks, documents, sources)
   *
   * @param chunkId - Chunk ID
   * @returns ExtendedChunkData object (includes source information)
   * @throws Error if chunk does not exist
   */
  private async fetchChunkData(chunkId: number): Promise<ExtendedChunkData> {
    const result = await this.db
      .select({
        id: chunks.id,
        document_id: documents.id,
        source_id: sources.id,
        document_url: documents.url,
        document_title: documents.title,
        source_domain: sources.domain,
        source_name: sources.name,
        source_base_url: sources.baseUrl,
        source_app_url: sources.appUrl,
        source_description: sources.description,
        chunk_content: chunks.content,
        chunk_index: chunks.chunkIndex,
        createdAt: chunks.createdAt,
      })
      .from(chunks)
      .innerJoin(documents, eq(chunks.documentId, documents.id))
      .innerJoin(sources, eq(documents.sourceId, sources.id))
      .where(eq(chunks.id, chunkId))
      .limit(1)

    if (result.length === 0) {
      throw new Error(`Chunk not found: ${chunkId}`)
    }

    const row = result[0]
    return {
      id: row.id,
      document_id: row.document_id,
      source_id: row.source_id,
      document_url: row.document_url,
      document_title: row.document_title || '',
      source_domain: row.source_domain || '',
      source_name: row.source_name,
      source_base_url: row.source_base_url,
      source_app_url: row.source_app_url,
      source_description: row.source_description || '',
      chunk_content: row.chunk_content,
      chunk_index: row.chunk_index,
      createdAt: row.createdAt,
    }
  }

  /**
   * Build custom Prompt (apply Token limit)
   */
  private buildCustomPrompts(
    chunkData: ExtendedChunkData,
    chunkType: ChunkType
  ): { systemPrompt: string; userPrompt: string } {
    // Convert to ChunkData format
    const chunkForPrompt = {
      id: String(chunkData.id),
      source_id: String(chunkData.source_id),
      document_url: chunkData.document_url,
      document_title: chunkData.document_title,
      source_domain: chunkData.source_domain,
      chunk_content: chunkData.chunk_content,
      chunk_index: chunkData.chunk_index,
      created_at: chunkData.createdAt,
      // Pass app URL for action building (optional, LLM will infer if not set)
      source_app_url: chunkData.source_app_url || undefined,
    }

    // Use prompt-builder (Token limit already handled internally)
    const result = buildPrompt(chunkForPrompt, chunkType)

    return {
      systemPrompt: result.systemPrompt,
      userPrompt: result.userPrompt,
    }
  }

  /**
   * Count elements in siteCapability
   */
  private countElements(siteCapability: any): number {
    if (!siteCapability) return 0

    let count = 0

    // Count elements in pages
    if (siteCapability.pages) {
      for (const pageKey of Object.keys(siteCapability.pages)) {
        const page = siteCapability.pages[pageKey]
        if (page?.elements) {
          count += Object.keys(page.elements).length
        }
      }
    }

    // Count global_elements
    if (siteCapability.global_elements) {
      count += Object.keys(siteCapability.global_elements).length
    }

    return count
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    taskId: number,
    updates: {
      status?: RecordingTaskStatus
      progress?: number
      errorMessage?: string
      completedAt?: Date
      attemptCount?: number
    }
  ): Promise<void> {
    await this.db
      .update(recordingTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(recordingTasks.id, taskId))
  }
}
