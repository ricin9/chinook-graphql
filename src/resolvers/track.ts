import { Resolver } from './Resolver';

export const Track: Resolver = {
	mediaType: (parent, _args, ctx) => {
		if (parent.mediaType) return parent.mediaType;
		return ctx.dataloaders.mediatypes.load(parent.mediaTypeId);
	},
	genre: (parent, _args, ctx) => {
		if (parent.genre) return parent.genre;
		return ctx.dataloaders.genres.load(parent.genreId);
	},
	album: (parent, _args, ctx) => {
		if (parent.album) return parent.album;
		return ctx.dataloaders.albums.load(parent.albumId);
	},
	playlists: (parent, args, ctx) => {
		if (parent.playlists) return parent.playlists;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.trackPlaylists(first);
		return dataloader.load(parent.trackId);
	},
	invoiceLines: (parent, args, ctx) => {
		if (parent.invoiceLines) return parent.invoiceLines;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.trackInvoiceLines(first);
		return dataloader.load(parent.trackId);
	},
};
