import Link from 'next/link';

const sections: { heading: string; links: { label: string; href: string }[] }[] = [
	{
		heading: 'Platform',
		links: [
			{ label: 'Explorer', href: '/app' },
			{ label: 'Upload Data', href: '/upload' },
			{ label: 'Documentation', href: '/docs' }
		]
	},
	{
		heading: 'Resources',
		links: [
			{ label: 'API (coming soon)', href: '#' },
			{ label: 'Changelog', href: '/changelog' },
			{ label: 'Status', href: '/status' }
		]
	},
	{
		heading: 'Project',
		links: [
			{ label: 'About', href: '/about' },
			{ label: 'Contribute', href: '/contribute' },
			{ label: 'License', href: '/license' }
		]
	}
];

export function OceanFooter() {
	return (
		<footer className="relative mt-24 text-sm text-floatchat-inkMuted">
			{/* Top border glow */}
			<div className="bg-floatchat-primary border-t border-floatchat-border relative">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
					<div className="grid gap-10 md:grid-cols-4">
						<div className="md:col-span-1 space-y-4">
							<div className="flex items-center gap-2">
								<span className="relative inline-flex h-10 w-10 items-center justify-center">
									<span className="absolute inset-0 rounded-full bg-gradient-to-br from-floatchat-accent to-floatchat-gradientTo opacity-90" />
									<svg viewBox="0 0 40 40" className="relative w-6 h-6 text-white"><path fill="currentColor" d="M6 22c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4C26 14 14 14 6 10V6Z"/></svg>
								</span>
								<span className="font-semibold text-floatchat-ink text-lg tracking-tight">FloatChat</span>
							</div>
							<p className="text-floatchat-inkMuted/80 leading-relaxed pr-4">Oceanographic data exploration & conversion interface focused on clarity and performance.</p>
							<div className="flex gap-3 pt-2">
								<Link href="https://github.com" className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-white/5 border border-floatchat-border text-floatchat-inkMuted hover:text-floatchat-accent hover:border-floatchat-borderStrong transition" aria-label="GitHub">
									<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.575 2 12.207c0 4.5 2.865 8.315 6.839 9.675.5.097.682-.22.682-.48 0-.237-.01-1.022-.014-1.855-2.782.615-3.369-1.205-3.369-1.205-.455-1.178-1.11-1.492-1.11-1.492-.908-.633.07-.62.07-.62 1.004.072 1.532 1.05 1.532 1.05.892 1.557 2.341 1.108 2.91.847.091-.662.35-1.108.636-1.363-2.22-.259-4.555-1.135-4.555-5.047 0-1.115.39-2.027 1.029-2.741-.103-.26-.446-1.303.098-2.717 0 0 .84-.27 2.75 1.045A9.349 9.349 0 0 1 12 6.844a9.3 9.3 0 0 1 2.504.347c1.909-1.315 2.748-1.045 2.748-1.045.546 1.414.203 2.457.1 2.717.64.714 1.027 1.626 1.027 2.741 0 3.922-2.339 4.785-4.566 5.038.358.318.678.946.678 1.908 0 1.376-.012 2.484-.012 2.824 0 .262.18.58.688.478C19.138 20.52 22 16.705 22 12.207 22 6.575 17.523 2 12 2Z"/></svg>
								</Link>
							</div>
						</div>
						{sections.map(s => (
							<div key={s.heading} className="space-y-4">
								<h3 className="text-floatchat-ink font-semibold tracking-wide text-sm uppercase">{s.heading}</h3>
								<ul className="space-y-2">
									{s.links.map(l => (
										<li key={l.href}>
											<Link href={l.href} className="text-floatchat-inkMuted hover:text-floatchat-accent hover:underline underline-offset-4 decoration-floatchat-accent/30 transition">
												{l.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<div className="mt-12 pt-6 border-t border-floatchat-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-floatchat-inkMuted/60">
						<p>&copy; {new Date().getFullYear()} FloatChat. All rights reserved.</p>
						<div className="flex gap-4">
							<Link href="/privacy" className="hover:text-floatchat-accent">Privacy</Link>
							<Link href="/terms" className="hover:text-floatchat-accent">Terms</Link>
							<Link href="/security" className="hover:text-floatchat-accent">Security</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default OceanFooter;
