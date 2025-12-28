// Main client export
export { Actionbook } from './client.js'
export type {
  ActionbookOptions,
  ToolMethod,
  SearchActionsMethod,
  GetActionByIdMethod,
} from './client.js'

// API client (for advanced usage)
export { ApiClient } from './api-client.js'
export type { ApiClientOptions, FetchFunction } from './api-client.js'

// Types
export type {
  SearchType,
  ChunkSearchResult,
  ChunkActionDetail,
  ParsedElements,
  SourceItem,
  SourceListResult,
  SourceSearchResult,
  SearchActionsParams,
} from './types.js'

// Errors
export { ActionbookError, ErrorCodes, isActionbookError } from './errors.js'
export type { ActionbookErrorCode } from './errors.js'

// Tool definitions (for advanced usage)
export {
  searchActionsSchema,
  searchActionsDescription,
  searchActionsParams,
  getActionByIdSchema,
  getActionByIdDescription,
  getActionByIdParams,
} from './tool-defs.js'
export type {
  SearchActionsInput,
  GetActionByIdInput,
  ToolParams,
} from './tool-defs.js'
