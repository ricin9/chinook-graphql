import { createSchema, YogaInitialContext } from 'graphql-yoga';
import { eq } from 'drizzle-orm';
import { album, artist } from './db/schema';
import { ContextEnv } from './env';
import { getFieldInfo } from './util';

export const schema = createSchema<ContextEnv>({
	typeDefs: /* GraphQL */ `
		type Query {
			hello: String
			album(id: ID!): Album
			albums(limit: Int, offset: Int): [Album!]!
			artist(id: ID!): Artist
			artists(limit: Int, offset: Int): [Artist!]!
		}

		type Album {
			albumId: ID
			title: String
			artistId: Int
			artist: Artist
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
			album: Album
			mediaTypeId: Int
			genreId: Int
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
		},
		Artist: {
			albums: (parent, args, ctx) => {
				return Boolean(parent.albums)
					? parent.albums
					: ctx.db.query.album.findMany({
							where: eq(album.artistId, parent.artistId),
							limit: args.first || 20,
					  });
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
