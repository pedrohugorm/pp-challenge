import { Test, TestingModule } from '@nestjs/testing';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('MedicationsController', () => {
  let controller: MedicationsController;
  let medicationsService: MedicationsService;

  const mockMedicationsService = {
    getMedications: jest.fn(),
    searchMedications: jest.fn(),
    getMedicationBySlug: jest.fn(),
    getTagsByCategory: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
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
  ];

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
    tags_by_category: {
      conditions: ['Pain', 'Headache'],
      substances: ['Acetaminophen'],
    },
  };

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
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicationsController],
      providers: [
        {
          provide: MedicationsService,
          useValue: mockMedicationsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<MedicationsController>(MedicationsController);
    medicationsService = module.get<MedicationsService>(MedicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedications', () => {
    it('should return medications with default parameters', async () => {
      const mockResult = {
        medications: mockMedications,
        nextCursor: undefined,
        hasMore: false,
      };

      mockMedicationsService.getMedications.mockResolvedValue(mockResult);

      const result = await controller.getMedications({});

      expect(medicationsService.getMedications).toHaveBeenCalledWith(
        undefined,
        undefined,
      );

      expect(result).toEqual({
        medications: mockMedications,
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should return medications with custom cursor and limit', async () => {
      const cursor = 'cursor-base64';
      const limit = 10;
      const mockResult = {
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      };

      mockMedicationsService.getMedications.mockResolvedValue(mockResult);

      const result = await controller.getMedications({
        cursor,
        limit,
      });

      expect(medicationsService.getMedications).toHaveBeenCalledWith(
        cursor,
        limit,
      );

      expect(result).toEqual({
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      });
    });

    it('should handle empty medications result', async () => {
      const mockResult = {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };

      mockMedicationsService.getMedications.mockResolvedValue(mockResult);

      const result = await controller.getMedications({});

      expect(result).toEqual({
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle service errors', async () => {
      mockMedicationsService.getMedications.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getMedications({})).rejects.toThrow('Service error');
    });
  });

  describe('searchMedications', () => {
    it('should search medications with basic query', async () => {
      const searchDto = {
        query: 'test query',
      };

      const mockResult = {
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      };

      mockMedicationsService.searchMedications.mockResolvedValue(mockResult);

      const result = await controller.searchMedications(searchDto);

      expect(medicationsService.searchMedications).toHaveBeenCalledWith(
        'test query',
        {
          tags_condition: undefined,
          tags_substance: undefined,
          tags_indications: undefined,
          tags_strengths_concentrations: undefined,
          tags_population: undefined,
        },
        undefined,
        undefined,
      );

      expect(result).toEqual({
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      });
    });

    it('should search medications with all filters', async () => {
      const searchDto = {
        query: 'test query',
        limit: 10,
        cursor: 'cursor-base64',
        fuzzy: true,
        similarityThreshold: 0.5,
        tags_condition: ['Pain', 'Fever'],
        tags_substance: ['Acetaminophen'],
        tags_indications: ['Headache'],
        tags_strengths_concentrations: ['500mg'],
        tags_population: ['Adult'],
      };

      const mockResult = {
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      };

      mockMedicationsService.searchMedications.mockResolvedValue(mockResult);

      const result = await controller.searchMedications(searchDto);

      expect(medicationsService.searchMedications).toHaveBeenCalledWith(
        'test query',
        {
          tags_condition: ['Pain', 'Fever'],
          tags_substance: ['Acetaminophen'],
          tags_indications: ['Headache'],
          tags_strengths_concentrations: ['500mg'],
          tags_population: ['Adult'],
        },
        'cursor-base64',
        10,
      );

      expect(result).toEqual({
        medications: mockMedications,
        nextCursor: 'next-cursor-base64',
        hasMore: true,
      });
    });

    it('should search medications with partial filters', async () => {
      const searchDto = {
        query: 'test query',
        tags_condition: ['Pain'],
        tags_substance: ['Acetaminophen'],
      };

      const mockResult = {
        medications: mockMedications,
        nextCursor: undefined,
        hasMore: false,
      };

      mockMedicationsService.searchMedications.mockResolvedValue(mockResult);

      const result = await controller.searchMedications(searchDto);

      expect(medicationsService.searchMedications).toHaveBeenCalledWith(
        'test query',
        {
          tags_condition: ['Pain'],
          tags_substance: ['Acetaminophen'],
          tags_indications: undefined,
          tags_strengths_concentrations: undefined,
          tags_population: undefined,
        },
        undefined,
        undefined,
      );

      expect(result).toEqual({
        medications: mockMedications,
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle empty search results', async () => {
      const searchDto = {
        query: 'nonexistent',
      };

      const mockResult = {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };

      mockMedicationsService.searchMedications.mockResolvedValue(mockResult);

      const result = await controller.searchMedications(searchDto);

      expect(result).toEqual({
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle service errors in search', async () => {
      const searchDto = {
        query: 'test query',
      };

      mockMedicationsService.searchMedications.mockRejectedValue(
        new Error('Search service error'),
      );

      await expect(controller.searchMedications(searchDto)).rejects.toThrow(
        'Search service error',
      );
    });
  });

  describe('getMedicationBySlug', () => {
    it('should return medication by slug', async () => {
      mockMedicationsService.getMedicationBySlug.mockResolvedValue(mockMedication);

      const result = await controller.getMedicationBySlug('test-medication');

      expect(medicationsService.getMedicationBySlug).toHaveBeenCalledWith(
        'test-medication',
      );

      expect(result).toEqual(mockMedication);
    });

    it('should throw NotFoundException when medication is not found', async () => {
      mockMedicationsService.getMedicationBySlug.mockResolvedValue(null);

      await expect(
        controller.getMedicationBySlug('non-existent-medication'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        controller.getMedicationBySlug('non-existent-medication'),
      ).rejects.toThrow("Medication with slug 'non-existent-medication' not found");
    });

    it('should handle service errors', async () => {
      mockMedicationsService.getMedicationBySlug.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.getMedicationBySlug('test-medication'),
      ).rejects.toThrow('Service error');
    });

    it('should handle medication with all fields', async () => {
      const medicationWithAllFields = {
        ...mockMedication,
        ai_warnings: 'AI generated warnings',
        ai_dosing: 'AI generated dosing information',
        ai_use_and_conditions: 'AI generated use and conditions',
        ai_contraindications: 'AI generated contraindications',
        ai_description: 'AI generated description',
      };

      mockMedicationsService.getMedicationBySlug.mockResolvedValue(
        medicationWithAllFields,
      );

      const result = await controller.getMedicationBySlug('test-medication');

      expect(result).toEqual(medicationWithAllFields);
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

      mockMedicationsService.getMedicationBySlug.mockResolvedValue(
        medicationWithNullAIFields,
      );

      const result = await controller.getMedicationBySlug('test-medication');

      expect(result.ai_warnings).toBeNull();
      expect(result.ai_dosing).toBeNull();
      expect(result.ai_use_and_conditions).toBeNull();
      expect(result.ai_contraindications).toBeNull();
      expect(result.ai_description).toBeNull();
    });
  });

  describe('getTagsByCategory', () => {
    it('should return all tags', async () => {
      mockMedicationsService.getTagsByCategory.mockResolvedValue(mockTags);

      const result = await controller.getTagsByCategory();

      expect(medicationsService.getTagsByCategory).toHaveBeenCalled();

      expect(result).toEqual(mockTags);
    });

    it('should return empty array when no tags exist', async () => {
      mockMedicationsService.getTagsByCategory.mockResolvedValue([]);

      const result = await controller.getTagsByCategory();

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockMedicationsService.getTagsByCategory.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getTagsByCategory()).rejects.toThrow('Service error');
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

      mockMedicationsService.getTagsByCategory.mockResolvedValue(
        tagsWithDifferentCategories,
      );

      const result = await controller.getTagsByCategory();

      expect(result).toEqual(tagsWithDifferentCategories);
      expect(result).toHaveLength(4);
    });

    it('should handle single tag', async () => {
      const singleTag = [
        {
          id: 1,
          name: 'Pain',
          category: 'conditions',
        },
      ];

      mockMedicationsService.getTagsByCategory.mockResolvedValue(singleTag);

      const result = await controller.getTagsByCategory();

      expect(result).toEqual(singleTag);
      expect(result).toHaveLength(1);
    });
  });
}); 