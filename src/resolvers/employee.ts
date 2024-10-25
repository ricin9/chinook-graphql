import { eq } from 'drizzle-orm';
import { formatZodError, getFieldInfo } from '../util';
import { Resolver } from '../Resolver';
import { employee } from '../db/schema';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { GraphQLError } from 'graphql';

export const employeeQueries: Resolver = {
	employee: (_, args, ctx, info) => {
		return ctx.db.query.employee.findFirst({ where: eq(employee.employeeId, args.id) });
	},
	employees: (_, args, ctx, info) => {
		const reportsToField = getFieldInfo(info, 'reportsTo');
		const customersField = getFieldInfo(info, 'customers');
		const subordinatesField = getFieldInfo(info, 'subordinates');
		return ctx.db.query.employee.findMany({
			limit: Math.min(args.limit || 20, 100),
			offset: args.offset ?? 0,
			with: {
				customers: customersField ? { limit: Number(customersField.args.first) || 20 } : undefined,
				employee: reportsToField ? true : undefined,
				employees: subordinatesField
					? { limit: Number(subordinatesField.args.first) || 20 }
					: undefined,
			},
		});
	},
};
const newEmployeeSchema = createInsertSchema(employee, { email: z.string().email() }).omit({
	employeeId: true,
});

const updateEmployeeSchema = newEmployeeSchema.partial();

export const employeeMutations: Resolver = {
	newEmployee: async (_, args, ctx, info) => {
		const { success, data, error } = newEmployeeSchema.safeParse(args.input);
		if (!success) {
			throw new GraphQLError(formatZodError(error));
		}

		try {
			const [newEmployee] = await ctx.db.insert(employee).values(data).returning();
			return newEmployee;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('D1_ERROR') &&
				err.message.includes('SQLITE_CONSTRAINT')
			) {
				throw new GraphQLError('reportsTo is invalid');
			}
			throw new Error();
		}
	},

	updateEmployee: async (_, args, ctx, info) => {
		const { success, data, error } = updateEmployeeSchema.safeParse(args.input);
		if (!success) {
			throw new GraphQLError(formatZodError(error));
		}

		try {
			const [updatedEmployee] = await ctx.db
				.update(employee)
				.set(data)
				.where(eq(employee.employeeId, Number(args.id)))
				.returning();
			return updatedEmployee;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('D1_ERROR') &&
				err.message.includes('SQLITE_CONSTRAINT')
			) {
				throw new GraphQLError('reportsTo is invalid');
			}
			throw new Error();
		}
	},
};
export const Employee: Resolver = {
	reportsToEmp: (parent, _args, ctx) => {
		if (parent.reportsToEmp) return parent.reportsToEmp;
		return ctx.dataloaders.employees.load(parent.reportsTo);
	},
	customers: (parent, args, ctx) => {
		if (parent.customers) return parent.customers;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.employeeCustomers(first);
		return dataloader.load(parent.employeeId);
	},
	subordinates: (parent, args, ctx) => {
		if (parent.subordinates) return parent.subordinates;
		if (parent.employees) return parent.employees;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.employeeSubordinates(first);
		return dataloader.load(parent.employeeId);
	},
};
