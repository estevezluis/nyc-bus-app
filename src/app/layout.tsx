import './globals.css'

export const metadata = {
	title: 'NYC Bus Tracker',
	description: 'Track the next upcoming bus',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<meta
				httpEquiv="Content-Security-Policy"
				content="connect-src 'self' https://*.mapbox.com;"
			/>
			<body className="m-0 p-0">{children}</body>
		</html>
	)
}
