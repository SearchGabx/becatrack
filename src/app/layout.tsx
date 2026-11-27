import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Fuente hospedada en el repositorio para no depender de Google Fonts durante el build
const redHatDisplay = localFont({
  src: './fonts/RedHatDisplay-Variable.woff2',
  variable: '--font-red-hat',
  weight: '400 800',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BECATRACK · CUC Universidad de la Costa',
  description:
    'SaaS de gestión de becarios en Next.js 15: CRM de becarios, horas sociales, dependencias, staff de eventos y tareas en semáforo.',
  icons: {
    icon: '/logo-opcion-atlantico.png',
    shortcut: '/logo-opcion-atlantico.png',
    apple: '/logo-opcion-atlantico.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${redHatDisplay.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
