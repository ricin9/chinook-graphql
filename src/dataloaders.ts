import Dataloader from 'dataloader';
import { DB } from './db';
import { inArray } from 'drizzle-orm';
import { artist } from './db/schema';

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

		static getArtistsWithAlbumsBatch = {
			first: {} as Record<number, ReturnType<typeof this.getArtistsWithAlbumsBatchDataloader>>,
		};
		static getArtistsWithAlbumsBatchDataloader = (limit: number) =>
			new Dataloader(async (keys: readonly number[]) => {
				const rows = await db.query.artist.findMany({
					where: inArray(artist.artistId, keys as number[]),
					with: { albums: { limit: limit } },
				});

				for (const row of rows) {
					const { albums, ...artist } = row;
					this.getArtistsBatch.prime(row.artistId, artist);
				}
				return keys.map(
					(key) => rows.find((row) => row.artistId === key) || new Error('artist not found')
				);
			});
		static getAlbumsByArtistIdBatch = new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});
			return keys.map((key) => rows.filter((row) => row.artistId === key));
		});
	};
}
