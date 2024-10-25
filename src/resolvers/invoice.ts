import { eq } from 'drizzle-orm';
import { Resolver } from './Resolver';
import { invoice } from '../db/schema';
import { getFieldInfo } from '../util';

export const invoiceQueries: Resolver = {
	invoice: (_, args, ctx, info) => {
		const invoiceLinesField = getFieldInfo(info, 'invoiceLines');
		const customerField = getFieldInfo(info, 'customer');

		return ctx.db.query.invoice.findFirst({
			where: eq(invoice.invoiceId, args.id),
			with: {
				invoiceLines: invoiceLinesField
					? { limit: Number(invoiceLinesField.args.first) || 20 }
					: undefined,
				customer: customerField ? true : undefined,
			},
		});
	},
};

export const Invoice: Resolver = {
	invoiceLines: (parent, args, ctx) => {
		if (parent.invoiceLines) return parent.invoiceLines;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.invoiceInvoiceLines(first);
		return dataloader.load(parent.trackId);
	},
	customer: (parent, _args, ctx) => {
		if (parent.customer) return parent.customer;
		return ctx.dataloaders.customers.load(parent.customerId);
	},
};
