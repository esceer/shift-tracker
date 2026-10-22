import { fireEvent, render, screen } from '@testing-library/react-native';

import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('shows the value and calls the right handler', async () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    await render(
      <Stepper
        valueLabel="6h"
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        decrementLabel="Tuesday: 15 minutes less"
        incrementLabel="Tuesday: 15 minutes more"
      />,
    );

    expect(screen.getByText('6h')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Tuesday: 15 minutes less' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tuesday: 15 minutes more' }));
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });
});
