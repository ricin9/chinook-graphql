import Dataloader from 'dataloader';
import { DB } from './db';
import { inArray } from 'drizzle-orm';
import { album, artist, genre, invoice, mediaType, playlistTrack, track } from './db/schema';

export function createDataloaders(db: DB) {
	return class {
		static getArtistsBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.artist.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.artistId === key) || new Error('artist not found')
			);
		});

		static getTracksBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.track.findMany({
				where: inArray(track.trackId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.trackId === key) || new Error('track not found')
			);
		});

		static getInvoicesBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.invoice.findMany({
				where: inArray(invoice.invoiceId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.invoiceId === key) || new Error('track not found')
			);
		});

		static getArtistsWithAlbumsBatch = {
			first: {} as Record<number, ReturnType<typeof this.getArtistsWithAlbumsBatchDataloader>>,
		};
		static getAlbumTracksBatch = {
			first: {} as Record<number, ReturnType<typeof this.getAlbumTracksBatchDataloader>>,
		};
		static getTrackPlaylistsBatch = {
			first: {} as Record<number, ReturnType<typeof this.getTrackPlaylistsBatchDataloader>>,
		};
		static getPlaylistTracksBatch = {
			first: {} as Record<number, ReturnType<typeof this.getPlaylistTracksBatchDataloader>>,
		};
		static getGenreTracksBatch = {
			first: {} as Record<number, ReturnType<typeof this.getGenreTracksBatchDataloader>>,
		};
		static getTrackInvoiceLinesBatch = {
			first: {} as Record<number, ReturnType<typeof this.getTrackInvoiceLinesBatchDataloader>>,
		};
		static getArtistsWithAlbumsBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.artist.findMany({
					where: inArray(artist.artistId, keys as number[]),
					with: { albums: { limit: first } },
				});

				for (const row of rows) {
					const { albums, ...artist } = row;
					this.getArtistsBatch.prime(row.artistId, artist);
				}
				return keys.map(
					(key) => rows.find((row) => row.artistId === key) || new Error('artist not found')
				);
			});

		static getAlbumTracksBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				// could be better, could use only tracks album & Object.groupBy
				const rows = await db.query.album.findMany({
					columns: { albumId: true },
					where: inArray(album.albumId, keys as number[]),
					with: { tracks: { limit: first } },
				});

				return keys.map(
					(key) => rows.find((row) => row.albumId === key)?.tracks || new Error('artist not found')
				);
			});
		static getTrackPlaylistsBatchDataloader = (first: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				// could be better
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
						new Error('artist not found')
				);
			});
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
		static getAlbumsByArtistIdBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});
			return keys.map((key) => rows.filter((row) => row.artistId === key));
		});

		static getMediaTypeBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.mediaType.findMany({
				where: inArray(mediaType.mediaTypeId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.mediaTypeId === key));
		});
		static getGenreBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.genre.findMany({
				where: inArray(genre.genreId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.genreId === key));
		});

		static getAlbumBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(album.albumId, keys as number[]),
			});

			return keys.map((key) => rows.find((row) => row.albumId === key));
		});
	};
}
