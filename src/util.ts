import { GraphQLResolveInfo } from 'graphql';
import { ZodError } from 'zod';

export function getFieldInfo(info: GraphQLResolveInfo, fieldName: string) {
	const fieldSelection = info.fieldNodes[0].selectionSet!.selections.find(
		(selection) => (selection as Record<string, any>).name.value === fieldName
	);

	if (!fieldSelection) return null;
	const argsArr = (fieldSelection as Record<string, any>).arguments.map(
		(arg: Record<string, any>) => [arg.name.value, arg.value.value]
	);

	const args = Object.fromEntries<string>(argsArr);

	return {
		args,
	};
}

export function formatZodError(error: ZodError): string {
	return error.errors.map((e) => `${e.path.join(',')}: ${e.message}`).join(',');
}
