import { eq } from 'drizzle-orm';
import { album } from '../db/schema';
import { getFieldInfo } from '../util';
import { Resolver } from './Resolver';

export const albumQueries: Resolver = {
	album: (_, args, ctx, info) => {
		const tracksSelection = getFieldInfo(info, 'tracks');
		return ctx.db.query.album.findFirst({
			where: eq(album.albumId, args.id),
			with: {
				tracks: tracksSelection ? { limit: Number(tracksSelection.args.first) || 20 } : undefined,
			},
		});
	},
	albums: (_, args, ctx, info) => {
		const tracksSelection = getFieldInfo(info, 'tracks');
		return ctx.db.query.album.findMany({
			limit: args.limit || 20,
			offset: args.offset ?? 0,
			with: {
				tracks: tracksSelection ? { limit: Number(tracksSelection.args.first) || 20 } : undefined,
			},
		});
	},
};

export const Album: Resolver = {
	artist: (parent, _args, ctx, info) => {
		return ctx.dataloaders.artists.load(parent.artistId);
	},
	tracks: (parent, args, ctx, info) => {
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.albumTracks(first);
		return dataloader.load(parent.albumId);
	},
};
