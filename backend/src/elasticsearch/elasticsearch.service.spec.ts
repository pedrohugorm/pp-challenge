import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { Client } from '@elastic/elasticsearch';

// Mock the Elasticsearch client
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(),
}));

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;
  let configService: ConfigService;
  let mockClient: jest.Mocked<Client>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockElasticsearchClient = {
    ping: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default config values
    mockConfigService.get
      .mockReturnValueOnce('localhost') // ELASTICSEARCH_HOST
      .mockReturnValueOnce('9200') // ELASTICSEARCH_PORT
      .mockReturnValueOnce('http://localhost:9200'); // ELASTICSEARCH_URL

    // Mock the Client constructor
    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockElasticsearchClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ElasticsearchService>(ElasticsearchService);
    configService = module.get<ConfigService>(ConfigService);
    mockClient = mockElasticsearchClient as any;

    // Call onModuleInit manually since it's called automatically
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize Elasticsearch client with correct configuration', async () => {
      expect(Client).toHaveBeenCalledWith({
        node: 'http://localhost:9200',
      });
    });

    it('should use custom configuration when provided', async () => {
      // Reset and setup custom config
      jest.clearAllMocks();
      mockConfigService.get
        .mockReturnValueOnce('custom-host')
        .mockReturnValueOnce('9300')
        .mockReturnValueOnce('http://custom-host:9300');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ElasticsearchService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const customService = module.get<ElasticsearchService>(ElasticsearchService);
      await customService.onModuleInit();

      expect(Client).toHaveBeenCalledWith({
        node: 'http://custom-host:9300',
      });
    });

    it('should log success when connection is established', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockClient.ping.mockResolvedValue({} as any);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ElasticsearchService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<ElasticsearchService>(ElasticsearchService);
      await newService.onModuleInit();

      expect(consoleSpy).toHaveBeenCalledWith('Elasticsearch connection established');
      consoleSpy.mockRestore();
    });

    it('should log error when connection fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockClient.ping.mockRejectedValue(new Error('Connection failed'));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ElasticsearchService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<ElasticsearchService>(ElasticsearchService);
      await newService.onModuleInit();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to Elasticsearch:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('searchMedications', () => {
    it('should call searchMedicationsWithFilters with correct parameters', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
            {
              _source: { slug: 'medication-2' },
              _score: 0.8,
              sort: [0.8],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedications('test query', 'cursor-123', 10);

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'drugs_db',
          size: 11, // limit + 1
          search_after: ['cursor-123'],
        }),
      );

      expect(result).toEqual({
        medications: [
          { slug: 'medication-1', score: 0.9 },
          { slug: 'medication-2', score: 0.8 },
        ],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should use default parameters when not provided', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedications('test query');

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 21, // default limit (20) + 1
          search_after: [],
        }),
      );

      expect(result).toEqual({
        medications: [{ slug: 'medication-1', score: 0.9 }],
        nextCursor: undefined,
        hasMore: false,
      });
    });
  });

  describe('searchMedicationsWithFilters', () => {
    it('should build search query with basic parameters', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      await service.searchMedicationsWithFilters('test query');

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'drugs_db',
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: 'test query',
                    fields: [
                      'drugName',
                      'genericName',
                      'title',
                      'ai_description',
                      'ai_warnings',
                      'ai_dosing',
                      'ai_use_and_conditions',
                      'ai_contraindications',
                      'metaDescription',
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
              ],
              filter: [],
            },
          },
          sort: [{ _score: { order: 'desc' } }],
          size: 21,
          search_after: [],
        }),
      );
    });

    it('should add tag filters when provided', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const filters = {
        tags_condition: ['Pain', 'Fever'],
        tags_substance: ['Acetaminophen'],
        tags_indications: ['Headache'],
        tags_strengths_concentrations: ['500mg'],
        tags_population: ['Adult'],
      };

      await service.searchMedicationsWithFilters('test query', filters);

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: expect.any(Array),
              filter: [
                {
                  terms: {
                    tags_condition: ['Pain', 'Fever'],
                  },
                },
                {
                  terms: {
                    tags_substance: ['Acetaminophen'],
                  },
                },
                {
                  terms: {
                    tags_indications: ['Headache'],
                  },
                },
                {
                  terms: {
                    tags_strengths_concentrations: ['500mg'],
                  },
                },
                {
                  terms: {
                    tags_population: ['Adult'],
                  },
                },
              ],
            },
          },
        }),
      );
    });

    it('should handle partial filters', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const filters = {
        tags_condition: ['Pain'],
        tags_substance: ['Acetaminophen'],
      };

      await service.searchMedicationsWithFilters('test query', filters);

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: expect.any(Array),
              filter: [
                {
                  terms: {
                    tags_condition: ['Pain'],
                  },
                },
                {
                  terms: {
                    tags_substance: ['Acetaminophen'],
                  },
                },
              ],
            },
          },
        }),
      );
    });

    it('should handle pagination with cursor', async () => {
      const mockResponse = {
        hits: {
          total: { value: 3 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
            {
              _source: { slug: 'medication-2' },
              _score: 0.8,
              sort: [0.8],
            },
            {
              _source: { slug: 'medication-3' },
              _score: 0.7,
              sort: [0.7],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('test query', undefined, 'cursor-123', 2);

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          search_after: ['cursor-123'],
          size: 3, // limit + 1
        }),
      );

      expect(result).toEqual({
        medications: [
          { slug: 'medication-1', score: 0.9 },
          { slug: 'medication-2', score: 0.8 },
        ],
        nextCursor: '0.8',
        hasMore: true,
      });
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        hits: {
          total: { value: 0 },
          hits: [],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('nonexistent query');

      expect(result).toEqual({
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle Elasticsearch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockClient.search.mockRejectedValue(new Error('Elasticsearch error'));

      const result = await service.searchMedicationsWithFilters('test query');

      expect(consoleSpy).toHaveBeenCalledWith('Elasticsearch search error:', expect.any(Error));
      expect(result).toEqual({
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      });

      consoleSpy.mockRestore();
    });

    it('should handle results with more items than limit', async () => {
      const mockResponse = {
        hits: {
          total: { value: 5 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
            {
              _source: { slug: 'medication-2' },
              _score: 0.8,
              sort: [0.8],
            },
            {
              _source: { slug: 'medication-3' },
              _score: 0.7,
              sort: [0.7],
            },
            {
              _source: { slug: 'medication-4' },
              _score: 0.6,
              sort: [0.6],
            },
            {
              _source: { slug: 'medication-5' },
              _score: 0.5,
              sort: [0.5],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('test query', undefined, undefined, 3);

      expect(result).toEqual({
        medications: [
          { slug: 'medication-1', score: 0.9 },
          { slug: 'medication-2', score: 0.8 },
          { slug: 'medication-3', score: 0.7 },
        ],
        nextCursor: '0.7',
        hasMore: true,
      });
    });

    it('should handle results with exactly limit items', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
            {
              _source: { slug: 'medication-2' },
              _score: 0.8,
              sort: [0.8],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('test query', undefined, undefined, 2);

      expect(result).toEqual({
        medications: [
          { slug: 'medication-1', score: 0.9 },
          { slug: 'medication-2', score: 0.8 },
        ],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle results with fewer items than limit', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('test query', undefined, undefined, 5);

      expect(result).toEqual({
        medications: [{ slug: 'medication-1', score: 0.9 }],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should log search query for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      await service.searchMedicationsWithFilters('test query');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Elasticsearch search query:',
        expect.stringContaining('test query'),
      );

      consoleSpy.mockRestore();
    });

    it('should log response hits count', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse = {
        hits: {
          total: { value: 5 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: [0.9],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      await service.searchMedicationsWithFilters('test query');

      expect(consoleSpy).toHaveBeenCalledWith('Elasticsearch response hits:', { value: 5 });

      consoleSpy.mockRestore();
    });

    it('should handle missing sort values in response', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _source: { slug: 'medication-1' },
              _score: 0.9,
              sort: undefined,
            },
            {
              _source: { slug: 'medication-2' },
              _score: 0.8,
              sort: [0.8],
            },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse as any);

      const result = await service.searchMedicationsWithFilters('test query', undefined, undefined, 1);

      expect(result).toEqual({
        medications: [{ slug: 'medication-1', score: 0.9 }],
        nextCursor: undefined, // No sort value for first item
        hasMore: true,
      });
    });
  });
}); 