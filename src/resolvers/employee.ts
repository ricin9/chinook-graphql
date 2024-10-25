import { eq } from 'drizzle-orm';
import { getFieldInfo } from '../util';
import { Resolver } from '../Resolver';
import { employee } from '../db/schema';

export const employeeQueries: Resolver = {
	employee: (_, args, ctx, info) => {
		return ctx.db.query.employee.findFirst({ where: eq(employee.employeeId, args.id) });
	},
	employees: (_, args, ctx, info) => {
		const reportsToField = getFieldInfo(info, 'reportsTo');
		const customersField = getFieldInfo(info, 'customers');
		const subordinatesField = getFieldInfo(info, 'subordinates');
		return ctx.db.query.employee.findMany({
			limit: Math.min(args.limit || 20, 100),
			offset: args.offset ?? 0,
			with: {
				customers: customersField ? { limit: Number(customersField.args.first) || 20 } : undefined,
				employee: reportsToField ? true : undefined,
				employees: subordinatesField
					? { limit: Number(subordinatesField.args.first) || 20 }
					: undefined,
			},
		});
	},
};
export const Employee: Resolver = {
	reportsToEmp: (parent, _args, ctx) => {
		if (parent.reportsToEmp) return parent.reportsToEmp;
		return ctx.dataloaders.employees.load(parent.reportsTo);
	},
	customers: (parent, args, ctx) => {
		if (parent.customers) return parent.customers;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.employeeCustomers(first);
		return dataloader.load(parent.employeeId);
	},
	subordinates: (parent, args, ctx) => {
		if (parent.subordinates) return parent.subordinates;
		if (parent.employees) return parent.employees;
		const first = Number(args.first) || 20;
		const dataloader = ctx.dataloaders.employeeSubordinates(first);
		return dataloader.load(parent.employeeId);
	},
};
