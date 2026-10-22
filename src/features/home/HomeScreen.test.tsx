import { render, screen } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders the screen title', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('Home')).toBeOnTheScreen();
  });
});
