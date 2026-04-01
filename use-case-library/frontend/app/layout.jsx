import './globals.css';

export const metadata = { title: 'Use Case Library', description: 'Partner use case knowledge engine' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  );
}
