import { ReactNode, Suspense } from 'react';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/providers/settings-provider';
import { TooltipsProvider } from '@/providers/tooltips-provider';
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { ModulesProvider } from '@/providers/modules-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

import '@/css/styles.css';
import '@/components/keenicons/assets/styles.css';

export const metadata: Metadata = {
  title: {
    template: '%s | AI Dev Brain',
    default: 'AI Dev Brain',
  }
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full scroll-smooth" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex flex-col h-full text-base text-foreground bg-background',
          dmSans.className,
          dmSans.variable,
          jetbrainsMono.variable,
        )}
      >
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider>
              <ThemeProvider>
                <I18nProvider>
                  <TooltipsProvider>
                    <ModulesProvider>
                      <Suspense>{children}</Suspense>
                      <Toaster />
                    </ModulesProvider>
                  </TooltipsProvider>
                </I18nProvider>
              </ThemeProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
