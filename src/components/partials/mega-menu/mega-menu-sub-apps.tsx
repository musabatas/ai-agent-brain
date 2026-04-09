'use client';

import { MenuConfig, MenuItem } from '@/config/types';
import { MegaMenuFooter, MegaMenuSubDefault } from './components';

const MegaMenuSubApps = ({ items }: { items: MenuConfig }) => {
  const appsItem = items[4];

  return (
    <div className="w-full gap-0 lg:w-[775px]">
      <div className="pt-4 pb-2 lg:p-7.5">
        <div className="flex lg:gap-10">
          {appsItem.children?.map((item: MenuItem, index) => {
            return (
              <div key={`profile-${index}`} className="flex flex-col grow">
                <h3 className="text-sm text-foreground font-semibold leading-none ps-2.5 mb-2 lg:mb-4">
                  {item.title}
                </h3>
                <div className="grid lg:grid-cols-2 lg:gap-5 grow">
                  {item.children?.map((item: MenuItem, index) => {
                    return (
                      <div
                        key={`apps-sub-${index}`}
                        className="grow space-y-0.5"
                      >
                        {item.children && MegaMenuSubDefault(item.children)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MegaMenuFooter />
    </div>
  );
};

export { MegaMenuSubApps };
