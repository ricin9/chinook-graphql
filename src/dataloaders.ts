import Dataloader from 'dataloader';
import { DB } from './db';
import { inArray } from 'drizzle-orm';
import { artist } from './db/schema';

export function createDataloaders(db: DB) {
	return {
		getArtistsBatch: new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.artist.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});

			return keys.map(
				(key) => rows.find((row) => row.artistId === key) || new Error('artist not found')
			);
		}),
		getAlbumsByArtistIdBatch: new Dataloader(async (keys: readonly number[]) => {
			const rows = await db.query.album.findMany({
				where: inArray(artist.artistId, keys as number[]),
			});
			return keys.map((key) => rows.filter((row) => row.artistId === key));
		}),
	};
}
