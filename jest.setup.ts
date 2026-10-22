import { applyLanguage } from '@/i18n';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

beforeAll(async () => {
  await applyLanguage('en');
});
