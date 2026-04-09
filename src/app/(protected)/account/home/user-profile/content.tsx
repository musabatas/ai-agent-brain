'use client';

import {
  BasicSettings,
  Work,
} from './components';

export function AccountUserProfileContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <BasicSettings title="Basic Settings" />
      <Work />
    </div>
  );
}
