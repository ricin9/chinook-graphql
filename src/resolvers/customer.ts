import { eq } from 'drizzle-orm';
import { customer } from '../db/schema';
import { getFieldInfo } from '../util';
import { Resolver } from '../Resolver';

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
