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

  describe('searchMedications', () => {
    const mockElasticsearchResult = {
      medications: [
        { slug: 'test-medication-1' },
        { slug: 'test-medication-2' },
      ],
      nextCursor: 'next-cursor-base64',
      hasMore: true,
    };

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

    it('should search medications using Elasticsearch when results are found', async () => {
      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(mockElasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.searchMedications('test query');

      expect(mockElasticsearchService.searchMedicationsWithFilters).toHaveBeenCalledWith(
        'test query',
        undefined,
        undefined,
        20,
      );

      expect(mockPrismaService.drug.findMany).toHaveBeenCalledWith({
        where: {
          slug: {
            in: ['test-medication-1', 'test-medication-2'],
          },
        },
        select: expect.any(Object),
      });

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
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      });
    });

    it('should search medications with filters', async () => {
      const filters = {
        tags_condition: ['Pain'],
        tags_substance: ['Acetaminophen'],
      };

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(mockElasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      await service.searchMedications('test query', filters);

      expect(mockElasticsearchService.searchMedicationsWithFilters).toHaveBeenCalledWith(
        'test query',
        filters,
        undefined,
        20,
      );
    });

    it('should search medications with cursor and custom limit', async () => {
      const cursor = 'cursor-base64';
      const limit = 10;

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(mockElasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      await service.searchMedications('test query', undefined, cursor, limit);

      expect(mockElasticsearchService.searchMedicationsWithFilters).toHaveBeenCalledWith(
        'test query',
        undefined,
        cursor,
        limit,
      );
    });

    it('should fallback to database search when Elasticsearch returns no results', async () => {
      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue({
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      });

      // Mock the private searchMedicationsInDatabase method by mocking its behavior
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.searchMedications('test query');

      expect(mockElasticsearchService.searchMedicationsWithFilters).toHaveBeenCalled();
      expect(mockPrismaService.drug.findMany).toHaveBeenCalled();
    });

    it('should fallback to database search when Elasticsearch throws an error', async () => {
      mockElasticsearchService.searchMedicationsWithFilters.mockRejectedValue(new Error('Elasticsearch error'));

      // Mock the database search behavior
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.searchMedications('test query');

      expect(mockElasticsearchService.searchMedicationsWithFilters).toHaveBeenCalled();
      expect(mockPrismaService.drug.findMany).toHaveBeenCalled();
    });

    it('should maintain order of medications from Elasticsearch results', async () => {
      const elasticsearchResult = {
        medications: [
          { slug: 'test-medication-2' },
          { slug: 'test-medication-1' },
        ],
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      };

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(elasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.searchMedications('test query');

      // Should maintain the order from Elasticsearch (medication-2 first, then medication-1)
      expect(result.medications[0].slug).toBe('test-medication-2');
      expect(result.medications[1].slug).toBe('test-medication-1');
    });

    it('should filter out medications not found in database', async () => {
      const elasticsearchResult = {
        medications: [
          { slug: 'test-medication-1' },
          { slug: 'non-existent-medication' },
          { slug: 'test-medication-2' },
        ],
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      };

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(elasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(mockMedications);

      const result = await service.searchMedications('test query');

      // Should only return medications that exist in the database
      expect(result.medications).toHaveLength(2);
      expect(result.medications[0].slug).toBe('test-medication-1');
      expect(result.medications[1].slug).toBe('test-medication-2');
    });

    it('should handle medications with no tags in search results', async () => {
      const medicationsWithoutTags = [
        {
          ...mockMedications[0],
          tags: [],
        },
      ];

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(mockElasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(medicationsWithoutTags);

      const result = await service.searchMedications('test query');

      expect(result.medications[0].tags_by_category).toEqual({});
    });

    it('should group tags by category in search results', async () => {
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

      const elasticsearchResult = {
        medications: [{ slug: 'test-medication-1' }],
        nextCursor: undefined,
        hasMore: false,
      };

      mockElasticsearchService.searchMedicationsWithFilters.mockResolvedValue(elasticsearchResult);
      mockPrismaService.drug.findMany.mockResolvedValue(medicationsWithMultipleTags);

      const result = await service.searchMedications('test query');

             expect(result.medications[0].tags_by_category).toEqual({
         conditions: ['Pain', 'Headache'],
         substances: ['Acetaminophen'],
       });
     });
   });

   describe('getMedicationBySlug', () => {
     const mockMedication = {
       id: '1',
       name: 'Test Medication',
       generic_name: 'Test Generic',
       product_type: 'HUMAN PRESCRIPTION DRUG',
       effective_time: '2023-01-01',
       title: 'Test Title',
       slug: 'test-medication',
       updated_at: new Date('2023-01-01'),
       meta_description: 'Test description',
       ai_warnings: 'Test warnings',
       ai_dosing: 'Test dosing',
       ai_use_and_conditions: 'Test use and conditions',
       ai_contraindications: 'Test contraindications',
       ai_description: 'Test AI description',
       vector_similar_ranking: { ranking: 'test' },
       meta_description_blocks: { blocks: 'test' },
       description_blocks: { blocks: 'test' },
       use_and_conditions_blocks: { blocks: 'test' },
       contra_indications_blocks: { blocks: 'test' },
       warning_blocks: { blocks: 'test' },
       dosing_blocks: { blocks: 'test' },
       labeler: {
         id: '1',
         name: 'Test Labeler',
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
         {
           tag: {
             name: 'Headache',
             category: 'conditions',
           },
         },
       ],
     };

     it('should return medication by slug with processed tags', async () => {
       mockPrismaService.drug.findUnique.mockResolvedValue(mockMedication);

       const result = await service.getMedicationBySlug('test-medication');

       expect(mockPrismaService.drug.findUnique).toHaveBeenCalledWith({
         where: {
           slug: 'test-medication',
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
           ai_warnings: true,
           ai_dosing: true,
           ai_use_and_conditions: true,
           ai_contraindications: true,
           ai_description: true,
           vector_similar_ranking: true,
           meta_description_blocks: true,
           description_blocks: true,
           use_and_conditions_blocks: true,
           contra_indications_blocks: true,
           warning_blocks: true,
           dosing_blocks: true,
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

       expect(result).toEqual({
         id: '1',
         name: 'Test Medication',
         generic_name: 'Test Generic',
         product_type: 'HUMAN PRESCRIPTION DRUG',
         effective_time: '2023-01-01',
         title: 'Test Title',
         slug: 'test-medication',
         updated_at: new Date('2023-01-01'),
         meta_description: 'Test description',
         ai_warnings: 'Test warnings',
         ai_dosing: 'Test dosing',
         ai_use_and_conditions: 'Test use and conditions',
         ai_contraindications: 'Test contraindications',
         ai_description: 'Test AI description',
         vector_similar_ranking: { ranking: 'test' },
         meta_description_blocks: { blocks: 'test' },
         description_blocks: { blocks: 'test' },
         use_and_conditions_blocks: { blocks: 'test' },
         contra_indications_blocks: { blocks: 'test' },
         warning_blocks: { blocks: 'test' },
         dosing_blocks: { blocks: 'test' },
         labeler: {
           id: '1',
           name: 'Test Labeler',
         },
         tags_by_category: {
           conditions: ['Pain', 'Headache'],
           substances: ['Acetaminophen'],
         },
       });
     });

     it('should return null when medication is not found', async () => {
       mockPrismaService.drug.findUnique.mockResolvedValue(null);

       const result = await service.getMedicationBySlug('non-existent-medication');

       expect(mockPrismaService.drug.findUnique).toHaveBeenCalledWith({
         where: {
           slug: 'non-existent-medication',
         },
         select: expect.any(Object),
       });

       expect(result).toBeNull();
     });

     it('should handle medication with no tags', async () => {
       const medicationWithoutTags = {
         ...mockMedication,
         tags: [],
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithoutTags);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.tags_by_category).toEqual({});
       expect(result.tags).toBeUndefined();
     });

     it('should group tags by category correctly', async () => {
       const medicationWithMultipleTags = {
         ...mockMedication,
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
           {
             tag: {
               name: 'Ibuprofen',
               category: 'substances',
             },
           },
         ],
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithMultipleTags);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.tags_by_category).toEqual({
         conditions: ['Pain', 'Headache'],
         substances: ['Acetaminophen', 'Ibuprofen'],
       });
     });

     it('should handle medication with single tag', async () => {
       const medicationWithSingleTag = {
         ...mockMedication,
         tags: [
           {
             tag: {
               name: 'Pain',
               category: 'conditions',
             },
           },
         ],
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithSingleTag);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.tags_by_category).toEqual({
         conditions: ['Pain'],
       });
     });

     it('should handle medication with tags in different categories', async () => {
       const medicationWithDifferentCategories = {
         ...mockMedication,
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
           {
             tag: {
               name: 'Adult',
               category: 'populations',
             },
           },
         ],
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithDifferentCategories);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.tags_by_category).toEqual({
         conditions: ['Pain'],
         substances: ['Acetaminophen'],
         populations: ['Adult'],
       });
     });

     it('should handle database errors gracefully', async () => {
       mockPrismaService.drug.findUnique.mockRejectedValue(new Error('Database error'));

       await expect(service.getMedicationBySlug('test-medication')).rejects.toThrow('Database error');
     });

     it('should handle medication with all AI fields', async () => {
       const medicationWithAllAIFields = {
         ...mockMedication,
         ai_warnings: 'AI generated warnings',
         ai_dosing: 'AI generated dosing information',
         ai_use_and_conditions: 'AI generated use and conditions',
         ai_contraindications: 'AI generated contraindications',
         ai_description: 'AI generated description',
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithAllAIFields);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.ai_warnings).toBe('AI generated warnings');
       expect(result.ai_dosing).toBe('AI generated dosing information');
       expect(result.ai_use_and_conditions).toBe('AI generated use and conditions');
       expect(result.ai_contraindications).toBe('AI generated contraindications');
       expect(result.ai_description).toBe('AI generated description');
     });

     it('should handle medication with null AI fields', async () => {
       const medicationWithNullAIFields = {
         ...mockMedication,
         ai_warnings: null,
         ai_dosing: null,
         ai_use_and_conditions: null,
         ai_contraindications: null,
         ai_description: null,
       };

       mockPrismaService.drug.findUnique.mockResolvedValue(medicationWithNullAIFields);

       const result = await service.getMedicationBySlug('test-medication');

       expect(result.ai_warnings).toBeNull();
       expect(result.ai_dosing).toBeNull();
       expect(result.ai_use_and_conditions).toBeNull();
       expect(result.ai_contraindications).toBeNull();
       expect(result.ai_description).toBeNull();
     });
   });

   describe('getTagsByCategory', () => {
     const mockTags = [
       {
         id: 1,
         name: 'Pain',
         category: 'conditions',
       },
       {
         id: 2,
         name: 'Fever',
         category: 'conditions',
       },
       {
         id: 3,
         name: 'Acetaminophen',
         category: 'substances',
       },
       {
         id: 4,
         name: 'Ibuprofen',
         category: 'substances',
       },
       {
         id: 5,
         name: 'Adult',
         category: 'populations',
       },
       {
         id: 6,
         name: 'Pediatric',
         category: 'populations',
       },
     ];

     it('should return all tags ordered by category and name', async () => {
       mockPrismaService.tag.findMany.mockResolvedValue(mockTags);

       const result = await service.getTagsByCategory();

       expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
         select: {
           id: true,
           name: true,
           category: true,
         },
         orderBy: [{ category: 'asc' }, { name: 'asc' }],
       });

       expect(result).toEqual(mockTags);
     });

     it('should return empty array when no tags exist', async () => {
       mockPrismaService.tag.findMany.mockResolvedValue([]);

       const result = await service.getTagsByCategory();

       expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
         select: {
           id: true,
           name: true,
           category: true,
         },
         orderBy: [{ category: 'asc' }, { name: 'asc' }],
       });

       expect(result).toEqual([]);
     });

     it('should handle tags with different categories', async () => {
       const tagsWithDifferentCategories = [
         {
           id: 1,
           name: 'Pain',
           category: 'conditions',
         },
         {
           id: 2,
           name: 'Acetaminophen',
           category: 'substances',
         },
         {
           id: 3,
           name: 'Adult',
           category: 'populations',
         },
         {
           id: 4,
           name: '500mg',
           category: 'strengths_concentrations',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(tagsWithDifferentCategories);

       const result = await service.getTagsByCategory();

       expect(result).toEqual(tagsWithDifferentCategories);
       expect(result).toHaveLength(4);
     });

     it('should handle tags with same category but different names', async () => {
       const tagsWithSameCategory = [
         {
           id: 1,
           name: 'Fever',
           category: 'conditions',
         },
         {
           id: 2,
           name: 'Pain',
           category: 'conditions',
         },
         {
           id: 3,
           name: 'Headache',
           category: 'conditions',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(tagsWithSameCategory);

       const result = await service.getTagsByCategory();

       expect(result).toEqual(tagsWithSameCategory);
       expect(result).toHaveLength(3);
       expect(result.every(tag => tag.category === 'conditions')).toBe(true);
     });

     it('should handle single tag', async () => {
       const singleTag = [
         {
           id: 1,
           name: 'Pain',
           category: 'conditions',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(singleTag);

       const result = await service.getTagsByCategory();

       expect(result).toEqual(singleTag);
       expect(result).toHaveLength(1);
    });

     it('should handle database errors gracefully', async () => {
       mockPrismaService.tag.findMany.mockRejectedValue(new Error('Database error'));

       await expect(service.getTagsByCategory()).rejects.toThrow('Database error');
     });

     it('should verify correct ordering by category and name', async () => {
       const unorderedTags = [
         {
           id: 3,
           name: 'Acetaminophen',
           category: 'substances',
         },
         {
           id: 1,
           name: 'Pain',
           category: 'conditions',
         },
         {
           id: 2,
           name: 'Fever',
           category: 'conditions',
         },
         {
           id: 4,
           name: 'Ibuprofen',
           category: 'substances',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(unorderedTags);

       const result = await service.getTagsByCategory();

       // The mock returns the data in the order provided, not sorted
       // We're testing that the correct query parameters are passed
       expect(result).toEqual(unorderedTags);
       expect(result).toHaveLength(4);
       
       // Verify that the correct ordering parameters were passed to the query
       expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
         select: {
           id: true,
           name: true,
           category: true,
         },
         orderBy: [{ category: 'asc' }, { name: 'asc' }],
       });
     });

     it('should handle tags with special characters in names', async () => {
       const tagsWithSpecialChars = [
         {
           id: 1,
           name: 'Pain & Discomfort',
           category: 'conditions',
         },
         {
           id: 2,
           name: '500mg/5ml',
           category: 'strengths_concentrations',
         },
         {
           id: 3,
           name: 'Acetaminophen (APAP)',
           category: 'substances',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(tagsWithSpecialChars);

       const result = await service.getTagsByCategory();

       expect(result).toEqual(tagsWithSpecialChars);
       expect(result).toHaveLength(3);
     });

     it('should handle tags with numeric names', async () => {
       const tagsWithNumericNames = [
         {
           id: 1,
           name: '100mg',
           category: 'strengths_concentrations',
         },
         {
           id: 2,
           name: '200mg',
           category: 'strengths_concentrations',
         },
         {
           id: 3,
           name: '50mg',
           category: 'strengths_concentrations',
         },
       ];

       mockPrismaService.tag.findMany.mockResolvedValue(tagsWithNumericNames);

       const result = await service.getTagsByCategory();

       expect(result).toEqual(tagsWithNumericNames);
       expect(result).toHaveLength(3);
       expect(result.every(tag => tag.category === 'strengths_concentrations')).toBe(true);
     });
   });
}); 