'use client';

import { useState } from 'react';
import { useTranslation, useTypedTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/providers/i18n-provider';
import { I18N_LANGUAGES } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function I18nExample() {
  const { t, i18n } = useTranslation();
  const { tButton, tLabel, tMessage, tNav } = useTypedTranslation();
  const { language, changeLanguage } = useLanguage();
  const [count, setCount] = useState(5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Translation Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Direct Translation Keys:</h3>
            <p><strong>Welcome:</strong> {t('common.messages.welcome')}</p>
            <p><strong>Loading:</strong> {t('common.messages.loading')}</p>
            <p><strong>Current Language:</strong> {language.name}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Using Typed Translation Helpers:</h3>
            <p><strong>Save Button:</strong> {tButton('save')}</p>
            <p><strong>Email Label:</strong> {tLabel('email')}</p>
            <p><strong>Success Message:</strong> {tMessage('success')}</p>
            <p><strong>Home Navigation:</strong> {tNav('home')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translation with Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Interpolation Example:</h3>
            <p>
              {t('You have {{count}} messages', { count })}
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCount(count - 1)}
                disabled={count <= 0}
              >
                -
              </Button>
              <span className="px-4 py-2">{count}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCount(count + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pluralization Example:</h3>
            <p>
              {t('item', { count })}
            </p>
            <p className="text-sm text-muted-foreground">
              Note: Add pluralization rules to your JSON files for proper plural forms
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language Switcher</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="font-semibold mb-4">Current Language: {language.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {I18N_LANGUAGES.map((lang) => (
                <Button
                  key={lang.code}
                  variant={language.code === lang.code ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage(lang.code)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    className="w-4 h-4"
                  />
                  {lang.shortName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debugging Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Current Language Code:</strong> {i18n.language}</p>
          <p><strong>Direction:</strong> {language.direction}</p>
          <p><strong>Available Languages:</strong> {i18n.languages.join(', ')}</p>
          <p><strong>Loaded Resources:</strong> {Object.keys(i18n.store.data).join(', ')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default I18nExample;