import { eq } from 'drizzle-orm';
import { getFieldInfo } from '../util';
import { Resolver } from '../Resolver';
import { playlist } from '../db/schema';

export const playlistQueries: Resolver = {
	playlist: async (_, args, ctx, info) => {
		const trackSelection = getFieldInfo(info, 'tracks');

		let row = await ctx.db.query.playlist.findFirst({
			where: eq(playlist.playlistId, args.id),
			with: {
				playlistTracks: trackSelection
					? {
							columns: {},
							with: { track: true },
							limit: Number(trackSelection.args.first) || 20,
					  }
					: undefined,
			},
		});

		if (!row || !trackSelection) return row;
		return {
			playlistId: row.playlistId,
			name: row.name,
			tracks: row.playlistTracks.map(
				(playlistTrack) => (playlistTrack as Record<string, any>).track as any
			),
		};
	},
	playlists: async (_, args, ctx, info) => {
		const trackSelection = getFieldInfo(info, 'tracks');

		let rows = await ctx.db.query.playlist.findMany({
			limit: Math.min(args.limit || 20, 100),
			offset: args.offset ?? 0,
			with: {
				playlistTracks: trackSelection
					? {
							columns: {},
							with: { track: true },
							limit: Number(trackSelection.args.first) || 20,
					  }
					: undefined,
			},
		});

		if (!trackSelection) return rows;
		return rows.map((row) => ({
			playlistId: row.playlistId,
			name: row.name,
			tracks: row.playlistTracks.map(
				(playlistTrack) => (playlistTrack as Record<string, any>).track as any
			),
		}));
	},
};
export const Playlist: Resolver = {
	tracks: (parent, args, ctx) => {
		if (parent.tracks) return parent.tracks;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.playlistTracks(first);
		return dataloader.load(parent.playlistId);
	},
};
