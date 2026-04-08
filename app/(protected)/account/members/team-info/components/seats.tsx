'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Seats = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seats</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <h4 className="text-base font-medium text-mono">14/49 Seats</h4>
        <p className="text-sm text-foreground">
          Additional seats have been added, yet availability remains limited –
          secure yours quickly today.
        </p>
        <div>
          <Button mode="link" underlined="dashed" asChild>
            <Link href="#">Learn more</Link>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="outline">
          <Link href="#">Add Seats</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { Seats };
