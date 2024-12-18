import { getFieldInfo } from '../util';
import { eq } from 'drizzle-orm';
import { album, artist } from '../db/schema';
import { Resolver } from '../Resolver';
import { createInsertSchema } from 'drizzle-zod';
import { GraphQLError } from 'graphql';

export const artistQueries: Resolver = {
	artist: (_, args, ctx, info) => {
		const albumSelection = getFieldInfo(info, 'albums');
		return ctx.db.query.artist.findFirst({
			where: eq(artist.artistId, args.id),
			with: {
				albums: albumSelection ? { limit: Number(albumSelection.args.first) || 20 } : undefined,
			},
		});
	},
	artists: (_, args, ctx, info) => {
		const albumSelection = getFieldInfo(info, 'albums');
		// max 100 because cloudflare d1 has "Maximum bound parameters per query" = 100
		// source: https://developers.cloudflare.com/d1/platform/limits/
		// you can hit this limit when you get albums with artist, if unique artist ids is more than 100
		// artist dataloader will error
		return ctx.db.query.artist.findMany({
			limit: Math.min(args.limit || 20, 100),
			offset: args.offset ?? 0,
			with: {
				albums: albumSelection ? { limit: Number(albumSelection.args.first) || 20 } : undefined,
			},
		});
	},
};

export const artistMutations: Resolver = {
	newArtist: async (_, args, ctx, info) => {
		if (args.name.length === 0) throw new GraphQLError('name must not be empty');

		const [newArtist] = await ctx.db.insert(artist).values({ name: args.name }).returning();
		return newArtist;
	},

	updateArtist: async (_, args, ctx, info) => {
		if (args.name.length === 0) throw new GraphQLError('name must not be empty');

		const [updatedArtist] = await ctx.db
			.update(artist)
			.set({ name: args.name })
			.where(eq(artist.artistId, Number(args.id)))
			.returning();
		return updatedArtist;
	},
};

export const Artist: Resolver = {
	albums: (parent, args, ctx, info) => {
		if (parent.albums) return parent.albums;
		return ctx.dataloaders.artistAlbums.load(parent.artistId);
	},
};
