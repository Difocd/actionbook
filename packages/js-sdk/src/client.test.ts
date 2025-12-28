import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Actionbook } from './client.js'
import { ChunkSearchResult, ChunkActionDetail } from './types.js'

// Create mock function
const fetchMock = vi.fn()

// Mock global fetch
vi.stubGlobal('fetch', fetchMock)

describe('Actionbook', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  describe('constructor', () => {
    it('creates instance with API key', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      expect(client).toBeInstanceOf(Actionbook)
    })

    it('creates instance with custom options', () => {
      const client = new Actionbook({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        timeoutMs: 5000,
      })
      expect(client).toBeInstanceOf(Actionbook)
    })
  })

  describe('searchActions', () => {
    const mockResult: ChunkSearchResult = {
      success: true,
      query: 'airbnb',
      results: [
        {
          action_id: 123,
          content: 'Airbnb search action',
          score: 0.95,
          createdAt: '2025-12-05T00:00:00.000Z',
        },
      ],
      count: 1,
      total: 1,
      hasMore: false,
    }

    it('searches with string query', async () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(mockResult), { status: 200 })
      )

      const result = await client.searchActions('airbnb')
      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].action_id).toBe(123)
    })

    it('searches with options object', async () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(mockResult), { status: 200 })
      )

      const result = await client.searchActions({
        query: 'airbnb',
        type: 'vector',
        limit: 10,
      })
      expect(result.success).toBe(true)

      const url = new URL(fetchMock.mock.calls[0][0] as string)
      expect(url.searchParams.get('q')).toBe('airbnb')
      expect(url.searchParams.get('type')).toBe('vector')
      expect(url.searchParams.get('limit')).toBe('10')
    })

    it('has description property', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      expect(client.searchActions.description).toBeDefined()
      expect(typeof client.searchActions.description).toBe('string')
      expect(client.searchActions.description).toContain('Search')
    })

    it('has params property with json and zod', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      expect(client.searchActions.params).toBeDefined()
      expect(client.searchActions.params.json).toBeDefined()
      expect(client.searchActions.params.zod).toBeDefined()
    })

    it('params.json has correct schema structure', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      const jsonSchema = client.searchActions.params.json as any
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties).toHaveProperty('query')
      expect(jsonSchema.required).toContain('query')
    })
  })

  describe('getActionById', () => {
    const mockDetail: ChunkActionDetail = {
      action_id: 123,
      content: '# Airbnb Search\n\nSearch for accommodations.',
      elements: JSON.stringify({
        search_button: {
          css_selector: '.search-btn',
          description: 'Search button',
        },
      }),
      createdAt: '2025-12-05T00:00:00.000Z',
      documentId: 1,
      documentTitle: 'Airbnb Actions',
      documentUrl: 'https://airbnb.com',
      chunkIndex: 0,
      heading: 'Airbnb Search',
      tokenCount: 100,
    }

    it('gets action by numeric id', async () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(mockDetail), { status: 200 })
      )

      const result = await client.getActionById(123)
      expect(result.action_id).toBe(123)
      expect(result.content).toContain('Airbnb Search')
    })

    it('gets action with options object', async () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(mockDetail), { status: 200 })
      )

      const result = await client.getActionById({ id: 123 })
      expect(result.action_id).toBe(123)
    })

    it('has description property', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      expect(client.getActionById.description).toBeDefined()
      expect(typeof client.getActionById.description).toBe('string')
      expect(client.getActionById.description).toContain('action')
    })

    it('has params property with json and zod', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      expect(client.getActionById.params).toBeDefined()
      expect(client.getActionById.params.json).toBeDefined()
      expect(client.getActionById.params.zod).toBeDefined()
    })

    it('params.json has correct schema structure', () => {
      const client = new Actionbook({ apiKey: 'test-key' })
      const jsonSchema = client.getActionById.params.json as any
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties).toHaveProperty('id')
      expect(jsonSchema.required).toContain('id')
    })
  })

  describe('tool definitions for LLM integration', () => {
    it('can be used with OpenAI SDK format', () => {
      const client = new Actionbook({ apiKey: 'test-key' })

      // OpenAI tool format
      const tool = {
        type: 'function' as const,
        function: {
          name: 'searchActions',
          description: client.searchActions.description,
          parameters: client.searchActions.params.json,
        },
      }

      expect(tool.function.name).toBe('searchActions')
      expect(tool.function.description).toBeDefined()
      expect(tool.function.parameters).toBeDefined()
    })

    it('can be used with Anthropic SDK format', () => {
      const client = new Actionbook({ apiKey: 'test-key' })

      // Anthropic tool format
      const tool = {
        name: 'getActionById',
        description: client.getActionById.description,
        input_schema: client.getActionById.params.json,
      }

      expect(tool.name).toBe('getActionById')
      expect(tool.description).toBeDefined()
      expect(tool.input_schema).toBeDefined()
    })
  })
})
