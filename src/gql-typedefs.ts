export const typeDefs = /* GraphQL */ `
	type Query {
		hello: String

		album(id: ID!): Album
		albums(limit: Int, offset: Int): [Album!]!

		artist(id: ID!): Artist
		artists(limit: Int, offset: Int): [Artist!]!

		genres(limit: Int, offset: Int): [Genre!]!
		genre(id: ID, name: String): Genre

		track(id: ID, name: String): Track

		playlist(id: ID!): Playlist
		playlists(limit: Int, offset: Int): [Playlist!]!

		invoice(id: ID!): Invoice
		invoices(limit: Int, offset: Int): [Invoice!]!

		employee(id: ID!): Employee
		employees(limit: Int, offset: Int): [Employee!]!

		customer(id: ID!): Customer
		customers(limit: Int, offset: Int): [Customer!]!
	}

	type Mutation {
		newCustomer(input: NewCustomerInput!): Customer!
		"""
		returns null if customer does not exist
		"""
		updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer

		newEmployee(input: NewEmployeeInput!): Employee!
		"""
		returns null if employee does not exist
		"""
		updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee

		newArtist(name: String!): Artist!
		"""
		returns null if artist does not exist
		"""
		updateArtist(id: ID!, name: String!): Artist

		newAlbum(artistId: ID!, title: String!): Album!
		"""
		returns null if album does not exist
		"""
		updateAlbum(id: ID!, title: String!): Album
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

	# Mutation inputs
	input NewCustomerInput {
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
	}
	input UpdateCustomerInput {
		firstName: String
		lastName: String
		company: String
		address: String
		city: String
		state: String
		country: String
		postalCode: String
		phone: String
		fax: String
		email: String
		supportRepId: Int
	}

	input NewEmployeeInput {
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
	}
	input UpdateEmployeeInput {
		lastName: String
		firstName: String
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
	}
`;
