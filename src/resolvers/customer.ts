import { Resolver } from './Resolver';

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
