'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { comingSoonToast } from '@/components/common/coming-soon-toast';
import { useAccount } from '../components/account-context';

export default function Page() {
  const { user } = useAccount();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription>
            Your primary addresses used to log in with Shoplit. It will be used
            for account-related notifications.
          </CardDescription>

          <div className="flex items-center gap-2.5 rounded-lg bg-accent/60 p-4 text-sm">
            <span className="font-medium">{user.email}</span>{' '}
            {user.emailVerifiedAt && (
              <Badge variant="success" appearance="light">
                Verified
              </Badge>
            )}
          </div>

          <Button variant="outline" onClick={() => comingSoonToast()}>
            Change email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription>
            To update your account password, click the button below and follow
            the instructions.
          </CardDescription>

          <Button variant="outline" onClick={() => comingSoonToast()}>
            Change password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription>
            Permanently remove your Personal Account and all of its contents
            from the Shoplit platform. This action is not reversible, so please
            continue with caution.
          </CardDescription>

          <Button variant="destructive" onClick={() => comingSoonToast()}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
