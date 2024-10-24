import { createSchema, YogaInitialContext } from 'graphql-yoga';
import { eq } from 'drizzle-orm';
import { album, artist, customer, employee, genre, invoice, playlist } from './db/schema';
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

			playlist(id: ID!): Playlist
			playlists(limit: Int, offset: Int): [Playlist!]!

			invoice(id: ID!): Invoice

			employee(id: ID!): Employee
			employees(limit: Int, offset: Int): [Employee!]!
		}

		type Album {
			albumId: ID!
			title: String!
			artistId: Int!
			artist: Artist!
			tracks(first: Int): [Track!]!
		}
		type Artist {
			artistId: ID!
			name: String
			albums(first: Int): [Album!]!
		}
		type Track {
			trackId: ID!
			name: String!
			composer: String
			milliseconds: Int
			bytes: Int
			unitPrice: String!
			albumId: Int!
			album: Album!
			mediaTypeId: Int!
			mediaType: MediaType!
			genreId: Int!
			genre: Genre!
			playlistId: Int!
			playlists(first: Int): [Playlist!]!
			invoiceLines(first: Int): [InvoiceLine!]!
		}
		type MediaType {
			mediaTypeId: ID!
			name: String!
			tracks(first: Int): [Track!]!
		}
		type Genre {
			genreId: ID!
			name: String
			tracks(first: Int): [Track!]!
		}
		type Playlist {
			playlistId: ID!
			name: String!
			tracks(first: Int): [Track!]!
		}
		type Invoice {
			invoiceId: ID!
			invoiceDate: String!
			billingAddress: String
			billingCity: String
			billingState: String
			billingCountry: String
			billingPostalCode: String
			total: String!
			customerId: Int!
			customer: Customer!
			invoiceLines(first: Int): [InvoiceLine!]!
		}
		type InvoiceLine {
			invoiceLineId: ID!
			invoiceId: Int!
			invoice: Invoice!
			trackId: Int!
			track: Track!
			unitPrice: String!
			quantity: String!
		}
		type Customer {
			customerId: ID!
			firstName: String!
			lastName: String!
			company: String
			address: String
			city: String
			state: String
			country: String
			postalCode: String
			phone: String
			fax: String
			email: String!
			supportRepId: Int
			supportRep: Employee
			invoices(first: Int): [Invoice!]!
		}
		type Employee {
			employeeId: ID!
			lastName: String!
			firstName: String!
			title: String
			birthDate: String
			hireDate: String
			address: String
			city: String
			state: String
			country: String
			postalCode: String
			phone: String
			fax: String
			email: String
			reportsTo: Int
			reportsToEmp: Employee
			subordinates: [Employee!]!
			customers(first: Int): [Customer!]!
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
			invoice: (_, args, ctx, info) => {
				const invoiceLinesField = getFieldInfo(info, 'invoiceLines');
				const customerField = getFieldInfo(info, 'customer');

				return ctx.db.query.invoice.findFirst({
					where: eq(invoice.invoiceId, args.id),
					with: {
						invoiceLines: invoiceLinesField
							? { limit: Number(invoiceLinesField.args.first) || 20 }
							: undefined,
						customer: customerField ? true : undefined,
					},
				});
			},
			employee: (_, args, ctx, info) => {
				return ctx.db.query.employee.findFirst({ where: eq(employee.employeeId, args.id) });
			},
			employees: (_, args, ctx, info) => {
				const reportsToField = getFieldInfo(info, 'reportsTo');
				const customersField = getFieldInfo(info, 'customers');
				const subordinatesField = getFieldInfo(info, 'subordinates');
				return ctx.db.query.employee.findMany({
					limit: Math.min(args.limit || 20, 100),
					offset: args.offset ?? 0,
					with: {
						customers: customersField
							? { limit: Number(customersField.args.first) || 20 }
							: undefined,
						employee: reportsToField ? true : undefined,
						employees: subordinatesField
							? { limit: Number(subordinatesField.args.first) || 20 }
							: undefined,
					},
				});
			},
		},
		Album: {
			artist: (parent, _args, ctx, info) => {
				return ctx.dataloaders.artists.load(parent.artistId);
			},
			tracks: (parent, args, ctx, info) => {
				const first = Number(args.first) || 20;
				const dataloader = ctx.dataloaders.albumTracks(first);
				return dataloader.load(parent.albumId);
			},
		},
		Artist: {
			albums: (parent, args, ctx, info) => {
				// prone to n+1
				if (parent.albums) return parent.albums;
				const tracksSelection = getFieldInfo(info, 'tracks');
				return ctx.db.query.album.findMany({
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
				const dataloader = getTrackInvoiceLinesBatchDataloader(ctx, first);
				return dataloader.load(parent.trackId);
			},
		},
		Playlist: {
			tracks: (parent, args, ctx) => {
				if (parent.tracks) return parent.tracks;
				const first = Number(args.first) || 20;
				const dataloader = getPlaylistTracksBatchDataloader(ctx, first);
				return dataloader.load(parent.playlistId);
			},
		},
		Genre: {
			tracks: (parent, args, ctx) => {
				if (parent.tracks) return parent.tracks;
				const first = Number(args.first) || 20;
				const dataloader = getGenreTracksBatchDataloader(ctx, first);
				return dataloader.load(parent.playlistId);
			},
		},
		InvoiceLine: {
			track: (parent, _args, ctx) => {
				if (parent.track) return parent.track;
				return ctx.dataloaders.tracks.load(parent.trackId);
			},
			invoice: (parent, _args, ctx) => {
				if (parent.invoice) return parent.invoice;
				return ctx.dataloaders.invoices.load(parent.invoiceId);
			},
		},
		Invoice: {
			invoiceLines: (parent, args, ctx) => {
				if (parent.invoiceLines) return parent.invoiceLines;
				const first = Number(args.first) || 20;
				const dataloader = getInvoiceInvoiceLinesBatchDataloader(ctx, first);
				return dataloader.load(parent.trackId);
			},
			customer: (parent, _args, ctx) => {
				if (parent.customer) return parent.customer;
				return ctx.dataloaders.customers.load(parent.customerId);
			},
		},
		Customer: {
			supportRep: (parent, _args, ctx) => {
				if (parent.supportRep) return parent.supportRep;
				if (!parent.supportRepId) return null;
				return ctx.dataloaders.employees.load(parent.supportRepId);
			},
			invoices: (parent, args, ctx) => {
				if (parent.invoices) return parent.invoices;
				const first = Number(args.first) || 20;
				const dataloader = getCustomerInvoicesBatchDataloader(ctx, first);
				return dataloader.load(parent.customerId);
			},
		},
		Employee: {
			reportsToEmp: (parent, _args, ctx) => {
				if (parent.reportsToEmp) return parent.reportsToEmp;
				return ctx.dataloaders.employees.load(parent.reportsTo);
			},
			customers: (parent, args, ctx) => {
				if (parent.customers) return parent.customers;
				const first = Number(args.first) || 20;
				const dataloader = getEmployeeCustomersBatchDataloader(ctx, first);
				return dataloader.load(parent.employeeId);
			},
			subordinates: (parent, args, ctx) => {
				if (parent.subordinates) return parent.subordinates;
				if (parent.employees) return parent.employees;
				const first = Number(args.first) || 20;
				const dataloader = getEmployeeSubordinatesBatchDataloader(ctx, first);
				return dataloader.load(parent.employeeId);
			},
		},
	},
});

function getPlaylistTracksBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.playlistTracks.first[first]) {
		dataloaders.playlistTracks.first[first] = dataloaders.getPlaylistTracksBatchDataloader(first);
	}
	return ctx.dataloaders.playlistTracks.first[first];
}

function getGenreTracksBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.genreTracks.first[first]) {
		dataloaders.genreTracks.first[first] = dataloaders.getGenreTracksBatchDataloader(first);
	}
	return ctx.dataloaders.genreTracks.first[first];
}

function getTrackInvoiceLinesBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.trackInvoiceLines.first[first]) {
		dataloaders.trackInvoiceLines.first[first] =
			dataloaders.getTrackInvoiceLinesBatchDataloader(first);
	}
	return ctx.dataloaders.trackInvoiceLines.first[first];
}

function getInvoiceInvoiceLinesBatchDataloader(
	ctx: ContextEnv & YogaInitialContext,
	first: number
) {
	const { dataloaders } = ctx;
	if (!dataloaders.invoiceInvoiceLines.first[first]) {
		dataloaders.invoiceInvoiceLines.first[first] =
			dataloaders.getInvoiceInvoiceLinesBatchDataloader(first);
	}
	return ctx.dataloaders.invoiceInvoiceLines.first[first];
}

function getCustomerInvoicesBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.customerInvoices.first[first]) {
		dataloaders.customerInvoices.first[first] =
			dataloaders.getCustomerInvoicesBatchDataloader(first);
	}
	return ctx.dataloaders.customerInvoices.first[first];
}

function getEmployeeCustomersBatchDataloader(ctx: ContextEnv & YogaInitialContext, first: number) {
	const { dataloaders } = ctx;
	if (!dataloaders.employeeCustomers.first[first]) {
		dataloaders.employeeCustomers.first[first] =
			dataloaders.getEmployeeCustomersBatchDataloader(first);
	}
	return ctx.dataloaders.employeeCustomers.first[first];
}

function getEmployeeSubordinatesBatchDataloader(
	ctx: ContextEnv & YogaInitialContext,
	first: number
) {
	const { dataloaders } = ctx;
	if (!dataloaders.employeeSubordinates.first[first]) {
		dataloaders.employeeSubordinates.first[first] =
			dataloaders.getEmployeeSubordinatesBatchDataloader(first);
	}
	return ctx.dataloaders.employeeSubordinates.first[first];
}
