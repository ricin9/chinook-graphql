import { eq } from 'drizzle-orm';
import { album } from '../db/schema';
import { getFieldInfo } from '../util';
import { Resolver } from '../Resolver';
import { GraphQLError } from 'graphql';

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

export const albumMutations: Resolver = {
	newAlbum: async (_, args, ctx, info) => {
		if (args.title.length === 0) throw new GraphQLError('name must not be empty');
		try {
			const [newAlbum] = await ctx.db
				.insert(album)
				.values({ title: args.title, artistId: Number(args.artistId) })
				.returning();
			return newAlbum;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('D1_ERROR') &&
				err.message.includes('SQLITE_CONSTRAINT')
			) {
				throw new GraphQLError('artistId is invalid');
			}
			throw new Error();
		}
	},

	updateAlbum: async (_, args, ctx, info) => {
		if (args.title.length === 0) throw new GraphQLError('name must not be empty');
		const [newAlbum] = await ctx.db
			.update(album)
			.set({ title: args.title })
			.where(eq(album.albumId, Number(args.id)))
			.returning();
		return newAlbum;
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
