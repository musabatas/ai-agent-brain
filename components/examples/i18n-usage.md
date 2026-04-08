# React-i18next Usage Guide

This guide explains how to use the internationalization (i18n) system in this Next.js application.

## Overview

The application uses `react-i18next` for internationalization with the following setup:
- Translation files stored in `i18n/messages/`
- Custom provider wrapping the app
- TypeScript support with helper hooks
- Language detection and persistence
- RTL/LTR direction support

## Basic Usage

### Using the useTranslation Hook

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.messages.welcome')}</h1>
      <p>{t('common.messages.loading')}</p>
    </div>
  );
}
```

### Using Typed Translation Helpers

```tsx
import { useTypedTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { tButton, tLabel, tMessage } = useTypedTranslation();

  return (
    <div>
      <button>{tButton('save')}</button>
      <label>{tLabel('email')}</label>
      <p>{tMessage('success')}</p>
    </div>
  );
}
```

## Translation with Parameters

### Interpolation

```tsx
const { t } = useTranslation();
const userName = 'John';

return <p>{t('Hello {{name}}!', { name: userName })}</p>;
```

### Pluralization

```tsx
const { t } = useTranslation();
const count = 5;

return <p>{t('item', { count })}</p>;
```

## Language Switching

### Using the Language Hook

```tsx
import { useLanguage } from '@/providers/i18n-provider';

function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div>
      <p>Current: {language.name}</p>
      <button onClick={() => changeLanguage('es')}>
        Switch to Spanish
      </button>
    </div>
  );
}
```

## Translation File Structure

Translation files should follow this structure:

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    },
    "labels": {
      "name": "Name",
      "email": "Email"
    },
    "messages": {
      "welcome": "Welcome",
      "loading": "Loading..."
    }
  },
  "pages": {
    "home": {
      "title": "Home Page",
      "description": "Welcome to our application"
    }
  },
  "navigation": {
    "home": "Home",
    "settings": "Settings"
  }
}
```

## Available Languages

The application supports the following languages:
- English (en)
- Arabic (ar) - RTL
- Spanish (es)
- German (de)
- Chinese (ch)

## Helper Functions

### tButton(key: string)
Translates button labels from `common.buttons.{key}`

### tLabel(key: string)
Translates form labels from `common.labels.{key}`

### tMessage(key: string)
Translates messages from `common.messages.{key}`

### tNav(key: string)
Translates navigation items from `navigation.{key}`

## Best Practices

1. **Organize Keys Logically**: Group related translations under common namespaces
2. **Use Descriptive Keys**: Make translation keys self-documenting
3. **Avoid Hardcoded Strings**: Always use translation keys instead of hardcoded text
4. **Test All Languages**: Ensure your UI works with different text lengths
5. **Handle Missing Translations**: Always provide fallback values

## RTL Support

The application automatically handles RTL (Right-to-Left) languages like Arabic:
- Document direction is set automatically
- Radix UI components adapt to direction
- Custom CSS can use `dir()` selectors for RTL-specific styles

## Debugging

Use the debugging information available in the i18n example component:
- Current language code
- Text direction
- Available languages
- Loaded translation resources

## Adding New Languages

1. Create a new JSON file in `i18n/messages/`
2. Add the language configuration to `i18n/config.ts`
3. Import the translations in `i18n/i18n.ts`
4. Add the language to the resources object

## Performance Considerations

- Translation files are loaded at build time
- Language switching is instant (no network requests)
- Translations are cached in memory
- The system is optimized for Next.js SSR/SSG