import Dataloader from 'dataloader';
import { DB } from './db';
import { inArray } from 'drizzle-orm';
import {
	album,
	artist,
	customer,
	employee,
	genre,
	invoice,
	mediaType,
	playlistTrack,
	track,
} from './db/schema';

export function createDataloaders(db: DB) {
	return class {
		static artists = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.artist.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.artistId === key) || new Error('artist not found')
			);
		});

		static tracks = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.track.findMany({
				where: inArray(track.trackId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.trackId === key) || new Error('track not found')
			);
		});

		static invoices = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.invoice.findMany({
				where: inArray(invoice.invoiceId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.invoiceId === key) || new Error('track not found')
			);
		});

		static customers = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.customer.findMany({
				where: inArray(customer.customerId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.customerId === key) || new Error('customer not found')
			);
		});
		static employees = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.employee.findMany({
				where: inArray(employee.employeeId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.employeeId === key) || new Error('customer not found')
			);
		});

		private static paginatedBatches: Record<
			string,
			{ first: Record<number, Dataloader<any, any>> }
		> = {};

		static albumTracks = (first: number) => {
			const dataloaderName = 'albumTracks';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.album.findMany({
					where: inArray(album.albumId, keys as number[]),
					columns: { albumId: true },
					with: { tracks: { limit: first } },
				});

				return keys.map(
					(key) => rows.find((row) => row.albumId === key) || new Error('artist not found')
				);
			});

			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};
		static trackPlaylists = (first: number) => {
			const dataloaderName = 'trackPlaylists';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.track.findMany({
					columns: { trackId: true },
					where: inArray(playlistTrack.trackId, keys as number[]),
					with: { playlistTracks: { columns: {}, with: { playlist: true }, limit: first } },
				});

				return keys.map(
					(key) =>
						rows
							.find((row) => row.trackId === key)
							?.playlistTracks.map((playlistTrack) => playlistTrack.playlist) ||
						new Error('track not found')
				);
			});

			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};
		static playlistTracks = {
			first: {} as Record<number, ReturnType<typeof this.getPlaylistTracksBatchDataloader>>,
		};
		static genreTracks = {
			first: {} as Record<number, ReturnType<typeof this.getGenreTracksBatchDataloader>>,
		};
		static trackInvoiceLines = {
			first: {} as Record<number, ReturnType<typeof this.getTrackInvoiceLinesBatchDataloader>>,
		};
		static invoiceInvoiceLines = {
			first: {} as Record<number, ReturnType<typeof this.getInvoiceInvoiceLinesBatchDataloader>>,
		};
		static customerInvoices = {
			first: {} as Record<number, ReturnType<typeof this.getCustomerInvoicesBatchDataloader>>,
		};
		static employeeCustomers = {
			first: {} as Record<number, ReturnType<typeof this.getEmployeeCustomersBatchDataloader>>,
		};
		static employeeSubordinates = {
			first: {} as Record<number, ReturnType<typeof this.getEmployeeSubordinatesBatchDataloader>>,
		};

		static getPlaylistTracksBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.playlist.findMany({
					columns: { playlistId: true },
					where: inArray(playlistTrack.playlistId, keys as number[]),
					with: { playlistTracks: { columns: {}, with: { track: true }, limit: first } },
				});

				return keys.map(
					(key) =>
						rows
							.find((row) => row.playlistId === key)
							?.playlistTracks.map((playlistTrack) => playlistTrack.track) ||
						new Error('artist not found')
				);
			});

		static getGenreTracksBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.genre.findMany({
					columns: { genreId: true },
					where: inArray(genre.genreId, keys as number[]),
					with: { tracks: { limit: first } },
				});

				return keys.map(
					(key) => rows.find((row) => row.genreId === key)?.tracks || new Error('genre not found')
				);
			});
		static getTrackInvoiceLinesBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.track.findMany({
					columns: { trackId: true },
					where: inArray(track.trackId, keys as number[]),
					with: { invoiceLines: { limit: first } },
				});

				return keys.map(
					(key) =>
						rows.find((row) => row.trackId === key)?.invoiceLines || new Error('track not found')
				);
			});

		static getInvoiceInvoiceLinesBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.invoice.findMany({
					columns: { invoiceId: true },
					where: inArray(invoice.invoiceId, keys as number[]),
					with: { invoiceLines: { limit: first } },
				});

				return keys.map(
					(key) =>
						rows.find((row) => row.invoiceId === key)?.invoiceLines || new Error('track not found')
				);
			});
		static getCustomerInvoicesBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.customer.findMany({
					columns: { customerId: true },
					where: inArray(customer.customerId, keys as number[]),
					with: { invoices: { limit: first } },
				});

				return keys.map(
					(key) =>
						rows.find((row) => row.customerId === key)?.invoices || new Error('track not found')
				);
			});
		static getEmployeeCustomersBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.employee.findMany({
					columns: { employeeId: true },
					where: inArray(employee.employeeId, keys as number[]),
					with: { customers: { limit: first } },
				});

				return keys.map((key) => rows.find((row) => row.employeeId === key)?.customers || []);
			});
		static getEmployeeSubordinatesBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.employee.findMany({
					columns: { employeeId: true },
					where: inArray(employee.employeeId, keys as number[]),
					with: { employees: { limit: first } },
				});

				return keys.map((key) => rows.find((row) => row.employeeId === key)?.employees || []);
			});
		static artistAlbums = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});

			for (let i = 0; i < rows.length; i++) {
				this.albums.prime(rows[i].albumId, rows[i]);
			}
			return keys.map((key) => rows.filter((row) => row.artistId === key));
		});

		static mediatypes = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.mediaType.findMany({
				where: inArray(mediaType.mediaTypeId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.mediaTypeId === key));
		});
		static genres = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.genre.findMany({
				where: inArray(genre.genreId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.genreId === key));
		});

		static albums = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(album.albumId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.albumId === key));
		});
	};
}
