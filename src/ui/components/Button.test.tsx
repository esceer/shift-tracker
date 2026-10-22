import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save change" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save change' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save change" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save change' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
