import { GraphQLResolveInfo } from 'graphql';
import { YogaInitialContext } from 'graphql-yoga';
import { ContextEnv } from '../env';

export type Resolver = Record<
	string,
	(
		parent: any,
		args: Record<string, any>,
		ctx: YogaInitialContext & ContextEnv,
		info: GraphQLResolveInfo
	) => any
>;
