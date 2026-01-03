import { describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';

import { createUserSchema, updateUserSchema } from '../user.validator';
import { baseUserSchema } from '../user.base';
import {
	sendOtpSignupSchema,
	sendOtpLoginSchema,
	verifyOtpSignupSchema,
	verifyOtpLoginSchema
} from '../auth.validator';

describe('User Zod Schemas', () => {
	const validLocationId = new mongoose.Types.ObjectId().toString();
	const validUserId = new mongoose.Types.ObjectId().toString();

	describe('baseUserSchema', () => {
		const validUser = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+11234567890',
			role: 'VOLUNTEER',
			approvalStatus: 'PENDING',
			approvedByUserObjectId: validUserId,
			locationObjectId: validLocationId,
			permissions: []
		};

		it('should validate a complete user object', () => {
			const result = baseUserSchema.safeParse(validUser);
			expect(result.success).toBe(true);
		});

		it('should reject empty first name', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				firstName: ''
			});
			expect(result.success).toBe(false);
		});

		it('should reject empty last name', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				lastName: ''
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid email', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				email: 'invalid-email'
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid phone format (missing country code)', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				phone: '1234567890'
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid phone format (wrong country code)', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				phone: '+441234567890'
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid role', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				role: 'INVALID_ROLE'
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid approvalStatus', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				approvalStatus: 'INVALID_STATUS'
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid locationObjectId', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				locationObjectId: 'invalid-id'
			});
			expect(result.success).toBe(false);
		});

		it('should accept valid permissions array', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				permissions: [
					{ action: 'read', subject: 'User' },
					{ action: 'create', subject: 'Survey' }
				]
			});
			expect(result.success).toBe(true);
		});

		it('should accept permissions with condition', () => {
			const result = baseUserSchema.safeParse({
				...validUser,
				permissions: [
					{ action: 'read', subject: 'User', condition: 'IS_CREATED_BY_SELF' }
				]
			});
			expect(result.success).toBe(true);
		});
	});

	describe('createUserSchema', () => {
		const validCreateUser = {
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane@example.com',
			phone: '+19876543210',
			role: 'MANAGER',
			locationObjectId: validLocationId
		};

		it('should validate a valid create user request', () => {
			const result = createUserSchema.safeParse(validCreateUser);
			expect(result.success).toBe(true);
		});

		it('should reject extra fields', () => {
			const result = createUserSchema.safeParse({
				...validCreateUser,
				extraField: 'should fail'
			});
			expect(result.success).toBe(false);
		});

		it('should reject missing required fields', () => {
			const result = createUserSchema.safeParse({
				firstName: 'Jane'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('updateUserSchema', () => {
		it('should validate partial updates', () => {
			const result = updateUserSchema.safeParse({
				firstName: 'Updated'
			});
			expect(result.success).toBe(true);
		});

		it('should validate empty object (no updates)', () => {
			const result = updateUserSchema.safeParse({});
			expect(result.success).toBe(true);
		});

		it('should reject invalid field values', () => {
			const result = updateUserSchema.safeParse({
				email: 'invalid-email'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Auth Validators', () => {
		describe('sendOtpSignupSchema', () => {
			const validSignup = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				phone: '+11234567890',
				role: 'VOLUNTEER',
				locationObjectId: validLocationId
			};

			it('should validate valid signup data', () => {
				const result = sendOtpSignupSchema.safeParse(validSignup);
				expect(result.success).toBe(true);
			});

			it('should reject missing required fields', () => {
				const result = sendOtpSignupSchema.safeParse({
					phone: '+11234567890'
				});
				expect(result.success).toBe(false);
			});
		});

		describe('sendOtpLoginSchema', () => {
			it('should validate login with phone only', () => {
				const result = sendOtpLoginSchema.safeParse({
					phone: '+11234567890'
				});
				expect(result.success).toBe(true);
			});

			it('should validate login with phone and email', () => {
				const result = sendOtpLoginSchema.safeParse({
					phone: '+11234567890',
					email: 'john@example.com'
				});
				expect(result.success).toBe(true);
			});

			it('should reject invalid phone', () => {
				const result = sendOtpLoginSchema.safeParse({
					phone: 'invalid'
				});
				expect(result.success).toBe(false);
			});
		});

		describe('verifyOtpSignupSchema', () => {
			const validVerifySignup = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				phone: '+11234567890',
				role: 'VOLUNTEER',
				locationObjectId: validLocationId,
				code: '123456'
			};

			it('should validate valid signup verification', () => {
				const result = verifyOtpSignupSchema.safeParse(validVerifySignup);
				expect(result.success).toBe(true);
			});

			it('should reject invalid OTP code (wrong length)', () => {
				const result = verifyOtpSignupSchema.safeParse({
					...validVerifySignup,
					code: '12345'
				});
				expect(result.success).toBe(false);
			});

			it('should reject invalid OTP code (non-numeric)', () => {
				const result = verifyOtpSignupSchema.safeParse({
					...validVerifySignup,
					code: '12345A'
				});
				expect(result.success).toBe(false);
			});
		});

		describe('verifyOtpLoginSchema', () => {
			it('should validate valid login verification', () => {
				const result = verifyOtpLoginSchema.safeParse({
					phone: '+11234567890',
					code: '654321'
				});
				expect(result.success).toBe(true);
			});

			it('should reject invalid OTP code', () => {
				const result = verifyOtpLoginSchema.safeParse({
					phone: '+11234567890',
					code: 'abc123'
				});
				expect(result.success).toBe(false);
			});

			it('should reject invalid phone', () => {
				const result = verifyOtpLoginSchema.safeParse({
					phone: 'invalid',
					code: '123456'
				});
				expect(result.success).toBe(false);
			});
		});
	});
});
