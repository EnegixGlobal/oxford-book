'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Package, Settings, Lock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    id: 'profile-info',
    label: 'Profile Information',
    icon: User,
    href: '/profile/profile-info',
    description: 'View and update your personal information'
  },
  {
    id: 'change-password',
    label: 'Change Password',
    icon: Lock,
    href: '/profile/change-password',
    description: 'Update your account password'
  },
	{
    id: 'orders',
    label: 'My Orders',
    icon: Package,
    href: '/profile/orders',
    description: 'View your order history and track shipments'
	},
	{
		id: 'shipping-address',
		label: 'Shipping Address',
		icon: MapPin,
		href: '/profile/shipping-address',
		description: 'Manage your shipping addresses for faster checkout'
	}
];


export default function ProfileLayout({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	// Hidden sections for admin
	const hiddenForAdmin = useMemo(() => new Set(['orders', 'shipping-address']), []);
	const currentId = useMemo(
		() => sidebarItems.find(i => i.href === pathname)?.id,
		[pathname]
	);
	const isAdmin = user?.role === 'admin';
	const shouldRedirectHidden = !!user && isAdmin && !!currentId && hiddenForAdmin.has(currentId!);
	const isUnauthenticated = !user;

	// Redirect unauthenticated users to home
	useEffect(() => {
		if (isUnauthenticated) {
			router.push('/');
		}
	}, [isUnauthenticated, router]);

	// Redirect admin away from hidden routes
	useEffect(() => {
		if (shouldRedirectHidden) {
			router.replace('/profile/profile-info');
		}
	}, [shouldRedirectHidden, router]);

	const itemsToRender = useMemo(() => {
		if (!user) return [] as typeof sidebarItems;
		return isAdmin ? sidebarItems.filter(i => !hiddenForAdmin.has(i.id)) : sidebarItems;
	}, [user, isAdmin, hiddenForAdmin]);

	// While redirecting or unauthenticated, render nothing (hooks already run consistently)
	if (isUnauthenticated || shouldRedirectHidden) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Sidebar */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Settings className="w-5 h-5" />
									<span>Account Settings</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{itemsToRender.map((item: typeof sidebarItems[number]) => {
									const Icon = item.icon;
									const isActive = pathname === item.href;
									return (
										<Link
											key={item.id}
											href={item.href}
											className={cn(
												'w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors',
												isActive
													? 'bg-purple-100 text-purple-700 border border-purple-200'
													: 'hover:bg-gray-100 text-gray-700'
											)}
										>
											<Icon className="w-5 h-5" />
											<div>
												<div className="font-medium">{item.label}</div>
												<div className="text-xs text-gray-500">{item.description}</div>
											</div>
										</Link>
									);
								})}
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
