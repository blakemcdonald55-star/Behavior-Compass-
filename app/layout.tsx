import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Behavior Compass Classifier',
  description: 'Identify Needs • Decisions • Values from sentences (Chase Hughes-inspired)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
