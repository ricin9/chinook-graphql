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
		}
		type Artist {
			artistId: ID
			name: String
			albums(first: Int): [Album!]!
		}
	`,
	resolvers: {
		Query: {
			hello: () => 'world',
			album: (_, args, ctx) => ctx.db.query.album.findFirst({ where: eq(album.albumId, args.id) }),
			albums: (_, args, ctx) =>
				ctx.db.query.album.findMany({
					// max 100 because cloudflare d1 has "Maximum bound parameters per query" = 100
					// you can hit this limit when you get albums with artist, if unique artist ids is more than 100
					// artist dataloader will error
					limit: Math.min(args.limit ?? 20, 100),
					offset: args.offset ?? 0,
				}),
			artist: (_, args, ctx, info) => {
				// todo finish later, join conditionally
				const albumSelection = getFieldInfo(info, 'albums');
				if (albumSelection) {
					return ctx.db.query.artist.findFirst({
						where: eq(artist.artistId, args.id),
						with: { albums: { limit: Number(albumSelection.args.first) ?? 20 } },
					});
				} else {
					return ctx.db.query.artist.findFirst({ where: eq(artist.artistId, args.id) });
				}
			},
			artists: (_, args, ctx, info) => {
				const albumSelection = getFieldInfo(info, 'albums');
				if (albumSelection) {
					return ctx.db.query.artist.findMany({
						limit: Math.min(args.limit ?? 20, 100),
						offset: args.offset ?? 0,
						with: { albums: { limit: Number(albumSelection.args.first) ?? 20 } },
					});
				} else {
					return ctx.db.query.artist.findMany({
						// max 100 because cloudflare d1 has "Maximum bound parameters per query" = 100
						// you can hit this limit when you get albums with artist, if unique artist ids is more than 100
						// artist dataloader will error
						limit: Math.min(args.limit ?? 20, 100),
						offset: args.offset ?? 0,
					});
				}
			},
		},
		Album: {
			artist: (parent, _args, ctx, info) => {
				const albumSelection = getFieldInfo(info, 'albums');
				if (albumSelection) {
					const first = Number(albumSelection.args.first) ?? 20;
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
							limit: args.first ?? 20,
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
