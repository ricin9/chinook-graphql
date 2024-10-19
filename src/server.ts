import { createYoga } from 'graphql-yoga';
import { schema } from './gql-schema';
import { ContextEnv } from './env';
import { getDrizzleInstnace } from './db';
import { createDataloaders } from './dataloaders';

const yoga = createYoga<ContextEnv>({
	schema,
	graphqlEndpoint: '/',
	context: (env) => {
		const db = getDrizzleInstnace(env.DB as D1Database);

		return { db, dataloaders: createDataloaders(db) };
	},
	plugins: [
		{
			onExecute() {
				const start = performance.now();
				return {
					onExecuteDone() {
						const end = performance.now();
						console.log('query duration: ', end - start);
					},
				};
			},
		},
	],
});

export default {
	fetch: yoga.fetch,
};
