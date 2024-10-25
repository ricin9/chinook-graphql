import { createSchema } from 'graphql-yoga';
import { ContextEnv } from './env';
import { Album, albumMutations, albumQueries } from './resolvers/album';
import { Artist, artistMutations, artistQueries } from './resolvers/artist';
import { Customer, customerMutations, customerQueries } from './resolvers/customer';
import { Employee, employeeMutations, employeeQueries } from './resolvers/employee';
import { Genre, genreQueries } from './resolvers/genre';
import { Invoice, invoiceQueries } from './resolvers/invoice';
import { InvoiceLine } from './resolvers/invoiceLine';
import { Playlist, playlistQueries } from './resolvers/playlist';
import { Track, trackQueries } from './resolvers/track';
import { typeDefs } from './gql-typedefs';

export const schema = createSchema<ContextEnv>({
	typeDefs: typeDefs,
	resolvers: {
		Query: {
			hello: () => 'world',
			...artistQueries,
			...albumQueries,
			...genreQueries,
			...trackQueries,
			...playlistQueries,
			...invoiceQueries,
			...customerQueries,
			...employeeQueries,
		},
		Mutation: {
			...customerMutations,
			...employeeMutations,
			...artistMutations,
			...albumMutations,
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
