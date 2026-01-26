import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextFunction, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '@/types/auth';
import { validate } from '../validate';

describe('Validate Middleware', () => {
	let mockReq: Partial<AuthenticatedRequest>;
	let mockRes: Partial<Response>;
	let mockNext: jest.MockedFunction<NextFunction>;

	// Define a simple test schema
	const testSchema = z.object({
		name: z.string().min(1, 'Name is required'),
		email: z.string().email('Invalid email format'),
		age: z.number().min(18, 'Must be at least 18')
	});

	beforeEach(() => {
		mockReq = {
			body: {}
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
	});

	it('should call next() when validation passes', () => {
		mockReq.body = {
			name: 'John Doe',
			email: 'john@example.com',
			age: 25
		};

		const middleware = validate(testSchema);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRes.status).not.toHaveBeenCalled();
		expect(mockReq.body).toEqual({
			name: 'John Doe',
			email: 'john@example.com',
			age: 25
		});
	});

	it('should return 400 with validation error for invalid data', () => {
		mockReq.body = {
			name: '',
			email: 'invalid-email',
			age: 15
		};

		const middleware = validate(testSchema);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).not.toHaveBeenCalled();
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			code: 'VALIDATION_ERROR',
			message: expect.any(String),
			status: 400,
			errors: expect.any(Array)
		});
	});

	it('should return 400 when required fields are missing', () => {
		mockReq.body = {};

		const middleware = validate(testSchema);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).not.toHaveBeenCalled();
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			code: 'VALIDATION_ERROR',
			message: expect.any(String),
			status: 400,
			errors: expect.any(Array)
		});
	});

	it('should strip extra fields not in schema (default Zod behavior)', () => {
		mockReq.body = {
			name: 'John Doe',
			email: 'john@example.com',
			age: 25,
			extraField: 'should be stripped'
		};

		const middleware = validate(testSchema);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.body).toEqual({
			name: 'John Doe',
			email: 'john@example.com',
			age: 25
		});
	});

	it('should return error with multiple validation issues joined', () => {
		mockReq.body = {
			name: '',
			email: 'invalid',
			age: 10
		};

		const middleware = validate(testSchema);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.json).toHaveBeenCalled();
		const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
		expect(jsonCall.message).toContain(',');
	});

	it('should handle non-Zod errors with 500 status', () => {
		// Create a schema that throws a non-Zod error
		const mockSchema = {
			parse: () => {
				throw new Error('Non-Zod error');
			}
		};

		const middleware = validate(mockSchema as z.ZodSchema<any>);
		middleware(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).not.toHaveBeenCalled();
		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.json).toHaveBeenCalledWith({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Could not validate request body'
		});
	});
});
