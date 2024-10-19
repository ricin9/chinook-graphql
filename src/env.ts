import { createDataloaders } from './dataloaders';
import { DB } from './db';

export interface ContextEnv {
	DB: D1Database;
	db: DB;
	dataloaders: ReturnType<typeof createDataloaders>;
}
