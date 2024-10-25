import { Resolver } from '../Resolver';

export const InvoiceLine: Resolver = {
	track: (parent, _args, ctx) => {
		if (parent.track) return parent.track;
		return ctx.dataloaders.tracks.load(parent.trackId);
	},
	invoice: (parent, _args, ctx) => {
		if (parent.invoice) return parent.invoice;
		return ctx.dataloaders.invoices.load(parent.invoiceId);
	},
};
