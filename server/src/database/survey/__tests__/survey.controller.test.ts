import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import Survey from '@/database/survey/mongoose/survey.model';
import Seed from '@/database/seed/mongoose/seed.model';
import { errors } from '@/database/utils/errors';
import {
	getParentSurveySurveyCodeUsingSurveyCode,
	generateUniqueChildSurveyCodes,
	generateUniqueSurveyCode
} from '../survey.controller';

// Mock the Survey and Seed models
jest.mock('@/database/survey/mongoose/survey.model');
jest.mock('@/database/seed/mongoose/seed.model');

const MockedSurvey = Survey as jest.Mocked<typeof Survey>;
const MockedSeed = Seed as jest.Mocked<typeof Seed>;

describe('Survey Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getParentSurveySurveyCodeUsingSurveyCode', () => {
		it('should return parent survey code when found', async () => {
			const mockSelect = jest.fn().mockResolvedValue({
				surveyCode: 'PARENT01'
			});
			(MockedSurvey.findOne as jest.Mock).mockReturnValue({
				select: mockSelect
			});

			const result =
				await getParentSurveySurveyCodeUsingSurveyCode('CHILD001');

			expect(result).toBe('PARENT01');
			expect(MockedSurvey.findOne).toHaveBeenCalledWith({
				childSurveyCodes: { $in: ['CHILD001'] }
			});
			expect(mockSelect).toHaveBeenCalledWith({ surveyCode: 1 });
		});

		it('should return null when no parent survey found', async () => {
			const mockSelect = jest.fn().mockResolvedValue(null);
			(MockedSurvey.findOne as jest.Mock).mockReturnValue({
				select: mockSelect
			});

			const result =
				await getParentSurveySurveyCodeUsingSurveyCode('ORPHAN01');

			expect(result).toBeNull();
		});
	});

	describe('generateUniqueSurveyCode', () => {
		it('should generate a unique 8-character hex code', async () => {
			// All database checks return null (code is unique)
			(MockedSurvey.findOne as jest.Mock).mockResolvedValue(null);
			(MockedSeed.findOne as jest.Mock).mockResolvedValue(null);

			const code = await generateUniqueSurveyCode();

			expect(code).toHaveLength(8);
			expect(code).toMatch(/^[A-F0-9]{8}$/);
		});

		it('should retry when code exists as surveyCode', async () => {
			// First check finds existing survey, second and third attempts find nothing
			(MockedSurvey.findOne as jest.Mock)
				.mockResolvedValueOnce({ surveyCode: 'EXISTS' }) // First attempt - exists
				.mockResolvedValueOnce(null) // Second attempt - check surveyCode
				.mockResolvedValueOnce(null) // Second attempt - check childSurveyCodes
				.mockResolvedValueOnce(null); // Second attempt - check parentSurveyCode
			(MockedSeed.findOne as jest.Mock).mockResolvedValue(null);

			const code = await generateUniqueSurveyCode();

			expect(code).toHaveLength(8);
			expect(MockedSurvey.findOne).toHaveBeenCalled();
		});

		it('should throw error after 3 failed retries', async () => {
			// All database checks return an existing document
			(MockedSurvey.findOne as jest.Mock).mockResolvedValue({
				surveyCode: 'EXISTS'
			});

			await expect(generateUniqueSurveyCode()).rejects.toEqual(
				errors.SURVEY_CODE_GENERATION_ERROR
			);
		});
	});

	describe('generateUniqueChildSurveyCodes', () => {
		it('should generate 3 unique codes', async () => {
			// All database checks return null (codes are unique)
			(MockedSurvey.findOne as jest.Mock).mockResolvedValue(null);
			(MockedSeed.findOne as jest.Mock).mockResolvedValue(null);

			const codes = await generateUniqueChildSurveyCodes();

			expect(codes).toHaveLength(3);
			codes.forEach(code => {
				expect(code).toHaveLength(8);
				expect(code).toMatch(/^[A-F0-9]{8}$/);
			});

			// All codes should be unique
			const uniqueCodes = new Set(codes);
			expect(uniqueCodes.size).toBe(3);
		});

		it('should throw error after 3 retries if cannot generate unique codes', async () => {
			// Always return existing document for all checks
			(MockedSurvey.findOne as jest.Mock).mockResolvedValue({
				surveyCode: 'EXISTS'
			});

			await expect(generateUniqueChildSurveyCodes()).rejects.toEqual(
				errors.SURVEY_CODE_GENERATION_ERROR
			);
		});
	});
});
