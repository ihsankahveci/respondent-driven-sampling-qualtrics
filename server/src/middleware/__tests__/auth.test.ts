import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	jest
} from '@jest/globals';
import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';

import Survey from '@/database/survey/mongoose/survey.model';
import User from '@/database/user/mongoose/user.model';
import { ApprovalStatus } from '@/database/utils/constants';
import { ROLES } from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';
import { generateAuthToken } from '@/utils/authTokenHandler';
import { auth } from '../auth';

// Mock environment variable for testing
const TEST_SECRET = 'test-secret-key';
const originalEnv = process.env.AUTH_SECRET;

// Mock User and Survey models
jest.mock('@/database/user/mongoose/user.model');
jest.mock('@/database/survey/mongoose/survey.model');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedSurvey = Survey as jest.Mocked<typeof Survey>;

describe('Auth Middleware', () => {
	let mockReq: Partial<AuthenticatedRequest>;
	let mockRes: Partial<Response>;
	let mockNext: jest.MockedFunction<NextFunction>;

	beforeAll(() => {
		process.env.AUTH_SECRET = TEST_SECRET;
	});

	afterAll(() => {
		process.env.AUTH_SECRET = originalEnv;
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			headers: {}
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			sendStatus: jest.fn().mockReturnThis()
		};
		mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
	});

	it('should reject request when no token provided', async () => {
		mockReq.headers = {};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'Access denied. No token provided'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request with invalid token', async () => {
		mockReq.headers = {
			authorization: 'Bearer invalid.token.here'
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: expect.stringContaining('Invalid Token')
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user does not exist in database', async () => {
		const nonExistentUserId = new mongoose.Types.ObjectId().toString();
		const token = generateAuthToken(nonExistentUserId);
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		// Mock User.findById to return null (user not found)
		(MockedUser.findById as jest.Mock).mockResolvedValue(null);

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not found. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user is not approved', async () => {
		const userId = new mongoose.Types.ObjectId();
		const locationId = new mongoose.Types.ObjectId();

		const mockUser = {
			_id: userId,
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: ROLES.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			locationObjectId: locationId,
			permissions: []
		};

		const token = generateAuthToken(userId.toString());
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		// Mock User.findById to return pending user
		(MockedUser.findById as jest.Mock).mockResolvedValue(mockUser);

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(403);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not approved yet. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user is rejected', async () => {
		const userId = new mongoose.Types.ObjectId();
		const locationId = new mongoose.Types.ObjectId();

		const mockUser = {
			_id: userId,
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: ROLES.VOLUNTEER,
			approvalStatus: ApprovalStatus.REJECTED,
			locationObjectId: locationId,
			permissions: []
		};

		const token = generateAuthToken(userId.toString());
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		// Mock User.findById to return rejected user
		(MockedUser.findById as jest.Mock).mockResolvedValue(mockUser);

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(403);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not approved yet. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should pass authentication for valid token and approved user', async () => {
		const userId = new mongoose.Types.ObjectId();
		const locationId = new mongoose.Types.ObjectId();

		const mockUser = {
			_id: userId,
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: ROLES.VOLUNTEER,
			approvalStatus: ApprovalStatus.APPROVED,
			locationObjectId: locationId,
			permissions: []
		};

		const token = generateAuthToken(userId.toString());
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		// Mock User.findById to return approved user
		(MockedUser.findById as jest.Mock).mockResolvedValue(mockUser);

		// Mock Survey.findOne to return null (no surveys yet)
		const mockSort = jest.fn().mockResolvedValue(null);
		(MockedSurvey.findOne as jest.Mock).mockReturnValue({ sort: mockSort });

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.authorization).toBeDefined();
	});

	it('should use latest survey location for permissions', async () => {
		const userId = new mongoose.Types.ObjectId();
		const userLocationId = new mongoose.Types.ObjectId();
		const surveyLocationId = new mongoose.Types.ObjectId();

		const mockUser = {
			_id: userId,
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: ROLES.ADMIN,
			approvalStatus: ApprovalStatus.APPROVED,
			locationObjectId: userLocationId,
			permissions: []
		};

		const mockLatestSurvey = {
			_id: new mongoose.Types.ObjectId(),
			locationObjectId: surveyLocationId
		};

		const token = generateAuthToken(userId.toString());
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		// Mock User.findById to return approved user
		(MockedUser.findById as jest.Mock).mockResolvedValue(mockUser);

		// Mock Survey.findOne to return a survey with different location
		const mockSort = jest.fn().mockResolvedValue(mockLatestSurvey);
		(MockedSurvey.findOne as jest.Mock).mockReturnValue({ sort: mockSort });

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.authorization).toBeDefined();
	});

	it('should handle token without Bearer prefix', async () => {
		const userId = new mongoose.Types.ObjectId();
		const locationId = new mongoose.Types.ObjectId();

		const mockUser = {
			_id: userId,
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: ROLES.VOLUNTEER,
			approvalStatus: ApprovalStatus.APPROVED,
			locationObjectId: locationId,
			permissions: []
		};

		const token = generateAuthToken(userId.toString());
		mockReq.headers = {
			authorization: token // No "Bearer " prefix
		};

		// Mock User.findById to return approved user
		(MockedUser.findById as jest.Mock).mockResolvedValue(mockUser);

		// Mock Survey.findOne to return null
		const mockSort = jest.fn().mockResolvedValue(null);
		(MockedSurvey.findOne as jest.Mock).mockReturnValue({ sort: mockSort });

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.authorization).toBeDefined();
	});
});
