import { GraphQLError } from 'graphql';
import { Resolver } from './Resolver';
import { getFieldInfo } from '../util';
import { genre } from '../db/schema';
import { eq } from 'drizzle-orm';

export const genreQueries: Resolver = {
	genre: (_, args, ctx, info) => {
		if (!args.id && !args.name) throw new GraphQLError('either id or name must be defined');
		const trackSelection = getFieldInfo(info, 'tracks');
		if (args.id) {
			return ctx.db.query.genre.findFirst({
				where: eq(genre.genreId, args.id),
				with: {
					tracks: trackSelection ? { limit: Number(trackSelection.args.first) || 20 } : undefined,
				},
			});
		}
		if (args.name) {
			return ctx.db.query.genre.findFirst({
				where: eq(genre.name, args.name),
				with: {
					tracks: trackSelection ? { limit: Number(trackSelection.args.first) || 20 } : undefined,
				},
			});
		}
	},

	genres: (_, args, ctx, info) => {
		const trackSelection = getFieldInfo(info, 'tracks');
		return ctx.db.query.genre.findMany({
			limit: Math.min(args.limit || 20, 100),
			offset: args.offset ?? 0,
			with: {
				tracks: trackSelection ? { limit: Number(trackSelection.args.first) || 20 } : undefined,
			},
		});
	},
};
export const Genre: Resolver = {
	tracks: (parent, args, ctx) => {
		if (parent.tracks) return parent.tracks;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.genreTracks(first);
		return dataloader.load(parent.playlistId);
	},
};
