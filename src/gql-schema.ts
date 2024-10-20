import { createSchema, YogaInitialContext } from 'graphql-yoga';
import { eq } from 'drizzle-orm';
import { album, artist, genre } from './db/schema';
import { ContextEnv } from './env';
import { getFieldInfo } from './util';
import { GraphQLError } from 'graphql';

export const schema = createSchema<ContextEnv>({
	typeDefs: /* GraphQL */ `
		type Query {
			hello: String
			album(id: ID!): Album
			albums(limit: Int, offset: Int): [Album!]!
			artist(id: ID!): Artist
			artists(limit: Int, offset: Int): [Artist!]!
			genres(limit: Int, offset: Int): [Genre!]!
			genre(id: ID, name: String): Genre
		}

		type Album {
			albumId: ID
			title: String
			artistId: Int
			artist: Artist!
			tracks(first: Int): [Track!]!
		}
		type Artist {
			artistId: ID
			name: String
			albums(first: Int): [Album!]!
		}
		type Track {
			trackId: ID
			name: String
			composer: String
			milliseconds: Int
			bytes: Int
			unitPrice: String
			albumId: Int
			album: Album!
			mediaTypeId: Int
			mediaType: MediaType!
			genreId: Int
			genre: Genre!
			playlistId: Int
			playlists(first: Int): [Playlist!]!
		}
		type MediaType {
			mediaTypeId: ID
			name: String
			tracks: [Track!]!
		}
		type Genre {
			genreId: ID
			name: String
			tracks: [Track!]!
		}
		type Playlist {
			playlistId: ID
			name: String
			tracks: [Track!]!
		}
	`,
	resolvers: {
		Query: {
			hello: () => 'world',
			album: (_, args, ctx, info) => {
				const tracksSelection = getFieldInfo(info, 'tracks');
				return ctx.db.query.album.findFirst({
					where: eq(album.albumId, args.id),
					with: {
						tracks: tracksSelection
							? { limit: Number(tracksSelection.args.first) || 20 }
							: undefined,
					},
				});
			},
			albums: (_, args, ctx, info) => {
				const tracksSelection = getFieldInfo(info, 'tracks');
				return ctx.db.query.album.findMany({
					limit: args.limit || 20,
					offset: args.offset ?? 0,
					with: {
						tracks: tracksSelection
							? { limit: Number(tracksSelection.args.first) || 20 }
							: undefined,
					},
				});
			},
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
			genre: (_, args, ctx, info) => {
				if (!args.id && !args.name) throw new GraphQLError('either id or name must be defined');
				const trackSelection = getFieldInfo(info, 'tracks');
				if (args.id) {
					return ctx.db.query.genre.findFirst({
						where: eq(genre.genreId, args.id),
						with: {
							tracks: trackSelection
								? { limit: Number(trackSelection.args.first) || 20 }
								: undefined,
						},
					});
				}
				if (args.name) {
					return ctx.db.query.genre.findFirst({
						where: eq(genre.name, args.name),
						with: {
							tracks: trackSelection
								? { limit: Number(trackSelection.args.first) || 20 }
								: undefined,
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
		},
		Album: {
			artist: (parent, _args, ctx, info) => {
				const albumSelection = getFieldInfo(info, 'albums');
				if (albumSelection) {
					const first = Number(albumSelection.args.first) || 20;
					const dataloader = getArtistsWithAlbumsBatchDataloader(ctx, first);
					return dataloader.load(parent.artistId);
				} else {
					return ctx.dataloaders.getArtistsBatch.load(parent.artistId);
				}
			},
			tracks: (parent, args, ctx, info) => {
				const first = Number(args.first) || 20;
				const dataloader = getAlbumTracksBatchDataloader(ctx, first);
				return dataloader.load(parent.albumId);
			},
		},
		Artist: {
			albums: (parent, args, ctx, info) => {
				const tracksSelection = getFieldInfo(info, 'tracks');
				return Boolean(parent.albums)
					? parent.albums
					: ctx.db.query.album.findMany({
							where: eq(album.artistId, parent.artistId),
							limit: args.first || 20,
							with: {
								tracks: tracksSelection
									? { limit: Number(tracksSelection.args.first) || 20 }
									: undefined,
							},
					  });
			},
		},
		Track: {
			mediaType: (parent, _args, ctx) => {
				return ctx.dataloaders.getMediaTypeBatch.load(parent.mediaTypeId);
			},
			genre: (parent, _args, ctx) => {
				return ctx.dataloaders.getGenreBatch.load(parent.genreId);
			},
			album: (parent, _args, ctx) => {
				return ctx.dataloaders.getAlbumBatch.load(parent.albumId);
			},
			playlists: (parent, args, ctx) => {
				const first = Number(args.first) || 20;
				const dataloader = getPlaylistsBatchDataloader(ctx, first);
				return dataloader.load(parent.trackId);
			},
		},
	},
});

function getArtistsWithAlbumsBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	if (!ctx.dataloaders.getArtistsWithAlbumsBatch.first[first]) {
		ctx.dataloaders.getArtistsWithAlbumsBatch.first[first] =
			ctx.dataloaders.getArtistsWithAlbumsBatchDataloader(first);
	}
	return ctx.dataloaders.getArtistsWithAlbumsBatch.first[first];
}

function getAlbumTracksBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	if (!ctx.dataloaders.getAlbumTracksBatch.first[first]) {
		ctx.dataloaders.getAlbumTracksBatch.first[first] =
			ctx.dataloaders.getAlbumTracksBatchDataloader(first);
	}
	return ctx.dataloaders.getAlbumTracksBatch.first[first];
}

function getPlaylistsBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.getTrackPlaylistsBatch.first[first]) {
		dataloaders.getTrackPlaylistsBatch.first[first] =
			dataloaders.getTrackPlaylistsBatchDataloader(first);
	}
	return ctx.dataloaders.getTrackPlaylistsBatch.first[first];
}
