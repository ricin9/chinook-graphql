import { eq } from 'drizzle-orm';
import { customer } from '../db/schema';
import { formatZodError, getFieldInfo } from '../util';
import { Resolver } from '../Resolver';
import { createInsertSchema } from 'drizzle-zod';
import { GraphQLError } from 'graphql';
import { z } from 'zod';

export const customerQueries: Resolver = {
	customer: (_, args, ctx, info) => {
		const invoiceSelection = getFieldInfo(info, 'invoices');
		const employeeSelection = getFieldInfo(info, 'supportRep');
		return ctx.db.query.customer.findFirst({
			where: eq(customer.customerId, args.id),
			with: {
				invoices: invoiceSelection
					? { limit: Number(invoiceSelection.args.first) || 20 }
					: undefined,
				employee: employeeSelection ? true : undefined,
			},
		});
	},
	customers: (_, args, ctx, info) => {
		const invoiceSelection = getFieldInfo(info, 'invoices');
		const employeeSelection = getFieldInfo(info, 'supportRep');
		return ctx.db.query.customer.findMany({
			limit: args.limit || 20,
			offset: args.offset ?? 0,
			with: {
				invoices: invoiceSelection
					? { limit: Number(invoiceSelection.args.first) || 20 }
					: undefined,
				employee: employeeSelection ? true : undefined,
			},
		});
	},
};

const newCustomerSchema = createInsertSchema(customer, { email: z.string().email() }).omit({
	customerId: true,
});

const updateCustomerSchema = newCustomerSchema.partial();

export const customerMutations: Resolver = {
	newCustomer: async (_, args, ctx, info) => {
		const { success, data, error } = newCustomerSchema.safeParse(args.input);
		if (!success) {
			throw new GraphQLError(formatZodError(error));
		}

		try {
			const [newCustomer] = await ctx.db.insert(customer).values(data).returning();
			return newCustomer;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('D1_ERROR') &&
				err.message.includes('SQLITE_CONSTRAINT')
			) {
				throw new GraphQLError('supportRepId is invalid');
			}
			throw new Error();
		}
	},

	updateCustomer: async (_, args, ctx, info) => {
		const { success, data, error } = updateCustomerSchema.safeParse(args.input);
		if (!success) {
			throw new GraphQLError(formatZodError(error));
		}

		try {
			const [updatedCustomer] = await ctx.db
				.update(customer)
				.set(data)
				.where(eq(customer.customerId, Number(args.id)))
				.returning();
			return updatedCustomer;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('D1_ERROR') &&
				err.message.includes('SQLITE_CONSTRAINT')
			) {
				throw new GraphQLError('supportRepId is invalid');
			}
			throw new Error();
		}
	},
};

export const Customer: Resolver = {
	supportRep: (parent, _args, ctx) => {
		if (parent.supportRep) return parent.supportRep;
		if (!parent.supportRepId) return null;
		return ctx.dataloaders.employees.load(parent.supportRepId);
	},
	invoices: (parent, args, ctx) => {
		if (parent.invoices) return parent.invoices;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.customerInvoices(first);
		return dataloader.load(parent.customerId);
	},
};
