const permissions = [
	{
		slug: 'dashboard.view',
		name: 'View Dashboard',
		description: 'Permission to access and view the dashboard.',
	},
	{
		slug: 'user.view',
		name: 'View Users',
		description: 'Permission to view the list of users.',
	},
	{
		slug: 'user.add',
		name: 'Add User',
		description: 'Permission to add new users.',
	},
	{
		slug: 'user.edit',
		name: 'Edit User',
		description: 'Permission to edit user details.',
	},
	{
		slug: 'user.delete',
		name: 'Delete User',
		description: 'Permission to delete users from the system.',
	},
	{
		slug: 'role.view',
		name: 'View Roles',
		description: 'Permission to view roles in the system.',
	},
	{
		slug: 'role.add',
		name: 'Add Role',
		description: 'Permission to create new roles.',
	},
	{
		slug: 'role.edit',
		name: 'Edit Role',
		description: 'Permission to edit existing roles.',
	},
	{
		slug: 'role.delete',
		name: 'Delete Role',
		description: 'Permission to remove roles from the system.',
	},
	{
		slug: 'permission.view',
		name: 'View Permissions',
		description: 'Permission to view all available permissions.',
	},
	{
		slug: 'permission.edit',
		name: 'Edit Permissions',
		description: 'Permission to edit existing permissions.',
	},
	{
		slug: 'product.view',
		name: 'View Products',
		description: 'Permission to view the list of products.',
	},
	{
		slug: 'product.add',
		name: 'Add Product',
		description: 'Permission to add new products.',
	},
	{
		slug: 'product.edit',
		name: 'Edit Product',
		description: 'Permission to edit existing products.',
	},
	{
		slug: 'product.delete',
		name: 'Delete Product',
		description: 'Permission to delete products.',
	},
	{
		slug: 'category.view',
		name: 'View Categories',
		description: 'Permission to view all product categories.',
	},
	{
		slug: 'category.add',
		name: 'Add Category',
		description: 'Permission to create new product categories.',
	},
	{
		slug: 'category.edit',
		name: 'Edit Category',
		description: 'Permission to edit product categories.',
	},
	{
		slug: 'category.delete',
		name: 'Delete Category',
		description: 'Permission to delete product categories.',
	},
	{
		slug: 'order.view',
		name: 'View Orders',
		description: 'Permission to view all orders in the system.',
	},
	{
		slug: 'order.add',
		name: 'Add Order',
		description: 'Permission to manually create new orders.',
	},
	{
		slug: 'order.edit',
		name: 'Edit Order',
		description: 'Permission to edit existing orders.',
	},
	{
		slug: 'order.delete',
		name: 'Delete Order',
		description: 'Permission to delete orders from the system.',
	},
	{
		slug: 'order.process',
		name: 'Process Order',
		description: 'Permission to update the status of orders.',
	},
	{
		slug: 'report.view',
		name: 'View Reports',
		description: 'Permission to view system and sales reports.',
	},
	{
		slug: 'report.export',
		name: 'Export Reports',
		description: 'Permission to export reports to a file.',
	},
	{
		slug: 'settings.manage',
		name: 'Manage Settings',
		description:
			'Permission to view and edit all system settings, including general, notifications, and integrations.',
	},
];

module.exports = permissions;
