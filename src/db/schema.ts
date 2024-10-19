import { sqliteTable, index, foreignKey, integer, numeric, primaryKey, text } from 'drizzle-orm/sqlite-core';

export const album = sqliteTable(
	'Album',
	{
		albumId: integer('AlbumId').primaryKey({ autoIncrement: true }).notNull(),
		title: text('Title', { length: 160 }).notNull(),
		artistId: integer('ArtistId')
			.notNull()
			.references(() => artist.artistId),
	},
	(table) => {
		return {
			ifkAlbumArtistId: index('IFK_AlbumArtistId').on(table.artistId),
		};
	}
);

export const artist = sqliteTable('Artist', {
	artistId: integer('ArtistId').primaryKey({ autoIncrement: true }).notNull(),
	name: text('Name', { length: 120 }),
});

export const customer = sqliteTable(
	'Customer',
	{
		customerId: integer('CustomerId').primaryKey({ autoIncrement: true }).notNull(),
		firstName: text('FirstName', { length: 40 }).notNull(),
		lastName: text('LastName', { length: 20 }).notNull(),
		company: text('Company', { length: 80 }),
		address: text('Address', { length: 70 }),
		city: text('City', { length: 40 }),
		state: text('State', { length: 40 }),
		country: text('Country', { length: 40 }),
		postalCode: text('PostalCode', { length: 10 }),
		phone: text('Phone', { length: 24 }),
		fax: text('Fax', { length: 24 }),
		email: text('Email', { length: 60 }).notNull(),
		supportRepId: integer('SupportRepId').references(() => employee.employeeId),
	},
	(table) => {
		return {
			ifkCustomerSupportRepId: index('IFK_CustomerSupportRepId').on(table.supportRepId),
		};
	}
);

export const employee = sqliteTable(
	'Employee',
	{
		employeeId: integer('EmployeeId').primaryKey({ autoIncrement: true }).notNull(),
		lastName: text('LastName', { length: 20 }).notNull(),
		firstName: text('FirstName', { length: 20 }).notNull(),
		title: text('Title', { length: 30 }),
		reportsTo: integer('ReportsTo'),
		birthDate: numeric('BirthDate'),
		hireDate: numeric('HireDate'),
		address: text('Address', { length: 70 }),
		city: text('City', { length: 40 }),
		state: text('State', { length: 40 }),
		country: text('Country', { length: 40 }),
		postalCode: text('PostalCode', { length: 10 }),
		phone: text('Phone', { length: 24 }),
		fax: text('Fax', { length: 24 }),
		email: text('Email', { length: 60 }),
	},
	(table) => {
		return {
			ifkEmployeeReportsTo: index('IFK_EmployeeReportsTo').on(table.reportsTo),
			employeeReportsToEmployeeEmployeeIdFk: foreignKey(() => ({
				columns: [table.reportsTo],
				foreignColumns: [table.employeeId],
				name: 'Employee_ReportsTo_Employee_EmployeeId_fk',
			})),
		};
	}
);

export const genre = sqliteTable('Genre', {
	genreId: integer('GenreId').primaryKey({ autoIncrement: true }).notNull(),
	name: text('Name', { length: 120 }),
});

export const invoice = sqliteTable(
	'Invoice',
	{
		invoiceId: integer('InvoiceId').primaryKey({ autoIncrement: true }).notNull(),
		customerId: integer('CustomerId')
			.notNull()
			.references(() => customer.customerId),
		invoiceDate: numeric('InvoiceDate').notNull(),
		billingAddress: text('BillingAddress', { length: 70 }),
		billingCity: text('BillingCity', { length: 40 }),
		billingState: text('BillingState', { length: 40 }),
		billingCountry: text('BillingCountry', { length: 40 }),
		billingPostalCode: text('BillingPostalCode', { length: 10 }),
		total: numeric('Total').notNull(),
	},
	(table) => {
		return {
			ifkInvoiceCustomerId: index('IFK_InvoiceCustomerId').on(table.customerId),
		};
	}
);

export const invoiceLine = sqliteTable(
	'InvoiceLine',
	{
		invoiceLineId: integer('InvoiceLineId').primaryKey({ autoIncrement: true }).notNull(),
		invoiceId: integer('InvoiceId')
			.notNull()
			.references(() => invoice.invoiceId),
		trackId: integer('TrackId')
			.notNull()
			.references(() => track.trackId),
		unitPrice: numeric('UnitPrice').notNull(),
		quantity: integer('Quantity').notNull(),
	},
	(table) => {
		return {
			ifkInvoiceLineTrackId: index('IFK_InvoiceLineTrackId').on(table.trackId),
			ifkInvoiceLineInvoiceId: index('IFK_InvoiceLineInvoiceId').on(table.invoiceId),
		};
	}
);

export const mediaType = sqliteTable('MediaType', {
	mediaTypeId: integer('MediaTypeId').primaryKey({ autoIncrement: true }).notNull(),
	name: text('Name', { length: 120 }),
});

export const playlist = sqliteTable('Playlist', {
	playlistId: integer('PlaylistId').primaryKey({ autoIncrement: true }).notNull(),
	name: text('Name', { length: 120 }),
});

export const playlistTrack = sqliteTable(
	'PlaylistTrack',
	{
		playlistId: integer('PlaylistId')
			.notNull()
			.references(() => playlist.playlistId),
		trackId: integer('TrackId')
			.notNull()
			.references(() => track.trackId),
	},
	(table) => {
		return {
			ifkPlaylistTrackTrackId: index('IFK_PlaylistTrackTrackId').on(table.trackId),
			ifkPlaylistTrackPlaylistId: index('IFK_PlaylistTrackPlaylistId').on(table.playlistId),
			pk0: primaryKey({ columns: [table.playlistId, table.trackId], name: 'PlaylistTrack_PlaylistId_TrackId_pk' }),
		};
	}
);

export const track = sqliteTable(
	'Track',
	{
		trackId: integer('TrackId').primaryKey({ autoIncrement: true }).notNull(),
		name: text('Name', { length: 200 }).notNull(),
		albumId: integer('AlbumId').references(() => album.albumId),
		mediaTypeId: integer('MediaTypeId')
			.notNull()
			.references(() => mediaType.mediaTypeId),
		genreId: integer('GenreId').references(() => genre.genreId),
		composer: text('Composer', { length: 220 }),
		milliseconds: integer('Milliseconds').notNull(),
		bytes: integer('Bytes'),
		unitPrice: numeric('UnitPrice').notNull(),
	},
	(table) => {
		return {
			ifkTrackMediaTypeId: index('IFK_TrackMediaTypeId').on(table.mediaTypeId),
			ifkTrackGenreId: index('IFK_TrackGenreId').on(table.genreId),
			ifkTrackAlbumId: index('IFK_TrackAlbumId').on(table.albumId),
		};
	}
);
