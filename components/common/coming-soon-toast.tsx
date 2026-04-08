import { RiErrorWarningFill } from '@remixicon/react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export const comingSoonToast = () => {
  toast.custom(() => (
    <Alert variant="mono" icon="success">
      <AlertIcon>
        <RiErrorWarningFill />
      </AlertIcon>
      <AlertTitle>This feature is coming soon.</AlertTitle>
    </Alert>
  ));
};
