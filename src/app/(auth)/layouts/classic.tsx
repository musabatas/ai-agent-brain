import { ReactNode } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export function ClassicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>
        {`
          .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
          }
          .dark .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
          }
        `}
      </style>
      <div className="flex flex-col items-center justify-center grow bg-center bg-no-repeat page-bg">
        <div className="m-5">
          <Link href="/" className="text-xl font-bold text-foreground">
            AI Dev Brain
          </Link>
        </div>
        <Card className="w-full max-w-[400px]">
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </div>
    </>
  );
}
