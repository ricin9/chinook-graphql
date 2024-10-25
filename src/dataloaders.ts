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
		static playlistTracks = (first: number) => {
			const dataloaderName = 'playlistTracks';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
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

			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

		static genreTracks = (first: number) => {
			const dataloaderName = 'genreTracks';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.genre.findMany({
					columns: { genreId: true },
					where: inArray(genre.genreId, keys as number[]),
					with: { tracks: { limit: first } },
				});

				return keys.map(
					(key) => rows.find((row) => row.genreId === key)?.tracks || new Error('genre not found')
				);
			});
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

		static trackInvoiceLines = (first: number) => {
			const dataloaderName = 'trackInvoiceLines';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
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
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

		static invoiceInvoiceLines = (first: number) => {
			const dataloaderName = 'invoiceInvoiceLines';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
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
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

		static customerInvoices = (first: number) => {
			const dataloaderName = 'customerInvoices';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
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
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};
		static employeeCustomers = (first: number) => {
			const dataloaderName = 'employeeCustomers';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.employee.findMany({
					columns: { employeeId: true },
					where: inArray(employee.employeeId, keys as number[]),
					with: { customers: { limit: first } },
				});

				return keys.map((key) => rows.find((row) => row.employeeId === key)?.customers || []);
			});
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

		static employeeSubordinates = (first: number) => {
			const dataloaderName = 'employeeSubordinates';
			const savedDataloder = this.paginatedBatches[dataloaderName]?.first[first];
			if (savedDataloder) {
				return savedDataloder;
			}

			const dataloader = new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.employee.findMany({
					columns: { employeeId: true },
					where: inArray(employee.employeeId, keys as number[]),
					with: { employees: { limit: first } },
				});

				return keys.map((key) => rows.find((row) => row.employeeId === key)?.employees || []);
			});
			this.paginatedBatches[dataloaderName].first[first] = dataloader;
			return dataloader;
		};

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
