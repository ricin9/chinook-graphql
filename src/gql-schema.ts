import { createSchema } from 'graphql-yoga';
import { ContextEnv } from './env';
import { Album, albumQueries } from './resolvers/album';
import { Artist, artistQueries } from './resolvers/artist';
import { Customer } from './resolvers/customer';
import { Employee, employeeQueries } from './resolvers/employee';
import { Genre, genreQueries } from './resolvers/genre';
import { Invoice, invoiceQueries } from './resolvers/invoice';
import { InvoiceLine } from './resolvers/invoiceLine';
import { Playlist, playlistQueries } from './resolvers/playlist';
import { Track } from './resolvers/track';
import { typeDefs } from './schema';

export const schema = createSchema<ContextEnv>({
	typeDefs: typeDefs,
	resolvers: {
		Query: {
			hello: () => 'world',
			...artistQueries,
			...albumQueries,
			...genreQueries,
			...playlistQueries,
			...invoiceQueries,
			...employeeQueries,
		},
		Album,
		Artist,
		Track,
		Playlist,
		Genre,
		Invoice,
		InvoiceLine,
		Customer,
		Employee,
	},
});
