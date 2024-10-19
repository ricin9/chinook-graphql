import { relations } from "drizzle-orm/relations";
import { artist, album, employee, customer, invoice, track, invoiceLine, playlistTrack, playlist, mediaType, genre } from "./schema";

export const albumRelations = relations(album, ({one, many}) => ({
	artist: one(artist, {
		fields: [album.artistId],
		references: [artist.artistId]
	}),
	tracks: many(track),
}));

export const artistRelations = relations(artist, ({many}) => ({
	albums: many(album),
}));

export const customerRelations = relations(customer, ({one, many}) => ({
	employee: one(employee, {
		fields: [customer.supportRepId],
		references: [employee.employeeId]
	}),
	invoices: many(invoice),
}));

export const employeeRelations = relations(employee, ({one, many}) => ({
	customers: many(customer),
	employee: one(employee, {
		fields: [employee.reportsTo],
		references: [employee.employeeId],
		relationName: "employee_reportsTo_employee_employeeId"
	}),
	employees: many(employee, {
		relationName: "employee_reportsTo_employee_employeeId"
	}),
}));

export const invoiceRelations = relations(invoice, ({one, many}) => ({
	customer: one(customer, {
		fields: [invoice.customerId],
		references: [customer.customerId]
	}),
	invoiceLines: many(invoiceLine),
}));

export const invoiceLineRelations = relations(invoiceLine, ({one}) => ({
	track: one(track, {
		fields: [invoiceLine.trackId],
		references: [track.trackId]
	}),
	invoice: one(invoice, {
		fields: [invoiceLine.invoiceId],
		references: [invoice.invoiceId]
	}),
}));

export const trackRelations = relations(track, ({one, many}) => ({
	invoiceLines: many(invoiceLine),
	playlistTracks: many(playlistTrack),
	mediaType: one(mediaType, {
		fields: [track.mediaTypeId],
		references: [mediaType.mediaTypeId]
	}),
	genre: one(genre, {
		fields: [track.genreId],
		references: [genre.genreId]
	}),
	album: one(album, {
		fields: [track.albumId],
		references: [album.albumId]
	}),
}));

export const playlistTrackRelations = relations(playlistTrack, ({one}) => ({
	track: one(track, {
		fields: [playlistTrack.trackId],
		references: [track.trackId]
	}),
	playlist: one(playlist, {
		fields: [playlistTrack.playlistId],
		references: [playlist.playlistId]
	}),
}));

export const playlistRelations = relations(playlist, ({many}) => ({
	playlistTracks: many(playlistTrack),
}));

export const mediaTypeRelations = relations(mediaType, ({many}) => ({
	tracks: many(track),
}));

export const genreRelations = relations(genre, ({many}) => ({
	tracks: many(track),
}));