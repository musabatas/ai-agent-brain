import { useTranslation as useI18nextTranslation } from 'react-i18next';

// Re-export useTranslation with proper typing
export const useTranslation = (namespace?: string) => {
  return useI18nextTranslation(namespace);
};

// Helper function for typed translation keys
export const useTypedTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  return {
    t,
    i18n,
    // Helper functions for common translation patterns
    tButton: (key: string) => t(`common.buttons.${key}`),
    tLabel: (key: string) => t(`common.labels.${key}`),
    tMessage: (key: string) => t(`common.messages.${key}`),
    tNav: (key: string) => t(`navigation.${key}`),
  };
};

export default useTranslation;