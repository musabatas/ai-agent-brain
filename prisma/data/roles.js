const roles = [
	{
		slug: 'admin',
		isProtected: true,
		name: 'Administrator',
		description: 'Administrator with full access to manage the system.',
	},
	{
		slug: 'manager',
		name: 'Manager',
		description:
			'Manager with permissions to oversee team operations and manage resources.',
	},
	{
		slug: 'staff',
		name: 'Staff',
		description: 'Staff member with limited access to specific operational tasks.',
	},
	{
		slug: 'support',
		name: 'Support',
		description:
			'Support team member responsible for handling customer queries and issues.',
	},
	{
		slug: 'vendor',
		name: 'Vendor',
		description: 'Vendor with access to manage their own products and orders.',
	},
	{
		slug: 'customer',
		name: 'Customer',
		isDefault: true,
		description:
			'Registered customer with access to purchase products and view their orders.',
	},
	{
		slug: 'guest',
		name: 'Guest',
		description: 'Unauthenticated user with limited access to view public content.',
	},
];

module.exports = roles;
