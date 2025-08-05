import { Test, TestingModule } from '@nestjs/testing';
import { MedicationsService } from './medications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

describe('MedicationsService', () => {
  let service: MedicationsService;
  let prismaService: PrismaService;
  let elasticsearchService: ElasticsearchService;

  const mockPrismaService = {
    drug: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
  };

  const mockElasticsearchService = {
    searchMedicationsWithFilters: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ElasticsearchService,
          useValue: mockElasticsearchService,
        },
      ],
    }).compile();

    service = module.get<MedicationsService>(MedicationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedications', () => {
    const mockMedications = [
      {
        id: '1',
        name: 'Test Medication 1',
        generic_name: 'Test Generic 1',
        product_type: 'HUMAN PRESCRIPTION DRUG',
        effective_time: '2023-01-01',
        title: 'Test Title 1',
        slug: 'test-medication-1',
        updated_at: new Date('2023-01-01'),
        meta_description: 'Test description 1',
        meta_description_blocks: null,
        labeler: {
          id: '1',
          name: 'Test Labeler 1',
        },
        tags: [
          {
            tag: {
              name: 'Pain',
              category: 'conditions',
            },
          },
          {
            tag: {
              name: 'Acetaminophen',
              category: 'substances',
            },
          },
        ],
      },
      {
        id: '2',
        name: 'Test Medication 2',
        generic_name: 'Test Generic 2',
        product_type: 'HUMAN PRESCRIPTION DRUG',
        effective_time: '2023-01-02',
        title: 'Test Title 2',
        slug: 'test-medication-2',
        updated_at: new Date('2023-01-02'),
        meta_description: 'Test description 2',
        meta_description_blocks: null,
        labeler: {
          id: '2',
          name: 'Test Labeler 2',
        },
        tags: [
          {
            tag: {
              name: 'Fever',
              category: 'conditions',
            },
          },
        ],
      },
    ];

    it('should return medications with default pagination', async () => {
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.getMedications();

      expect(result).toEqual({
        medications: [
          {
            id: '1',
            name: 'Test Medication 1',
            generic_name: 'Test Generic 1',
            product_type: 'HUMAN PRESCRIPTION DRUG',
            effective_time: '2023-01-01',
            title: 'Test Title 1',
            slug: 'test-medication-1',
            updated_at: new Date('2023-01-01'),
            meta_description: 'Test description 1',
            meta_description_blocks: null,
            labeler: {
              id: '1',
              name: 'Test Labeler 1',
            },
            tags_by_category: {
              conditions: ['Pain'],
              substances: ['Acetaminophen'],
            },
          },
          {
            id: '2',
            name: 'Test Medication 2',
            generic_name: 'Test Generic 2',
            product_type: 'HUMAN PRESCRIPTION DRUG',
            effective_time: '2023-01-02',
            title: 'Test Title 2',
            slug: 'test-medication-2',
            updated_at: new Date('2023-01-02'),
            meta_description: 'Test description 2',
            meta_description_blocks: null,
            labeler: {
              id: '2',
              name: 'Test Labeler 2',
            },
            tags_by_category: {
              conditions: ['Fever'],
            },
          },
        ],
        nextCursor: undefined,
        hasMore: false,
      });

      expect(mockPrismaService.drug.findMany).toHaveBeenCalledWith({
        take: 11, // limit + 1
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          generic_name: true,
          product_type: true,
          effective_time: true,
          title: true,
          slug: true,
          updated_at: true,
          meta_description: true,
          meta_description_blocks: true,
          labeler: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return medications with custom limit', async () => {
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.getMedications(undefined, 5);

      expect(result.medications).toHaveLength(2);
      expect(result.hasMore).toBe(false);

      expect(mockPrismaService.drug.findMany).toHaveBeenCalledWith({
        take: 6, // limit + 1
        orderBy: {
          id: 'asc',
        },
        select: expect.any(Object),
      });
    });

    it('should handle cursor-based pagination', async () => {
      const cursor = Buffer.from('1').toString('base64');
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.getMedications(cursor, 10);

      expect(mockPrismaService.drug.findMany).toHaveBeenCalledWith({
        take: 11,
        cursor: {
          id: '1',
        },
        orderBy: {
          id: 'asc',
        },
        select: expect.any(Object),
      });
    });

    it('should handle invalid cursor gracefully', async () => {
      const invalidCursor = 'invalid-base64';
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.getMedications(invalidCursor, 10);

      // When invalid cursor is provided, Buffer.from doesn't throw an error
      // but returns garbage data, so the cursor is still passed to the query
      expect(mockPrismaService.drug.findMany).toHaveBeenCalledWith({
        take: 11,
        cursor: {
          id: expect.any(String),
        },
        orderBy: {
          id: 'asc',
        },
        select: expect.any(Object),
      });
    });

    it('should return hasMore true when there are more items', async () => {
      // Return one extra item to indicate there are more
      const medicationsWithExtra = [...mockMedications, { 
        ...mockMedications[0], 
        id: '3',
        name: 'Test Medication 3',
        slug: 'test-medication-3'
      }];
      mockPrismaService.drug.findMany.mockResolvedValue(medicationsWithExtra);

      const result = await service.getMedications(undefined, 2);

      expect(result.hasMore).toBe(true);
      expect(result.medications).toHaveLength(2);
      expect(result.nextCursor).toBe(Buffer.from('2').toString('base64'));
    });

    it('should return hasMore false when there are no more items', async () => {
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.getMedications(undefined, 10);

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle medications with no tags', async () => {
      const medicationsWithoutTags = [
        {
          ...mockMedications[0],
          tags: [],
        },
      ];
      mockPrismaService.drug.findMany.mockResolvedValue(medicationsWithoutTags);

      const result = await service.getMedications();

      expect(result.medications[0].tags_by_category).toEqual({});
    });

    it('should group tags by category correctly', async () => {
      const medicationsWithMultipleTags = [
        {
          ...mockMedications[0],
          tags: [
            {
              tag: {
                name: 'Pain',
                category: 'conditions',
              },
            },
            {
              tag: {
                name: 'Headache',
                category: 'conditions',
              },
            },
            {
              tag: {
                name: 'Acetaminophen',
                category: 'substances',
              },
            },
          ],
        },
      ];
      mockPrismaService.drug.findMany.mockResolvedValue(medicationsWithMultipleTags);

      const result = await service.getMedications();

      expect(result.medications[0].tags_by_category).toEqual({
        conditions: ['Pain', 'Headache'],
        substances: ['Acetaminophen'],
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.drug.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getMedications()).rejects.toThrow('Database error');
    });
  });
}); 