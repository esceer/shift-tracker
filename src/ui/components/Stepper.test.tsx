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

  it('lets the user type the value', async () => {
    const onChangeMinutes = jest.fn();
    await render(
      <Stepper
        valueLabel="6h"
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        decrementLabel="less"
        incrementLabel="more"
        minutes={360}
        onChangeMinutes={onChangeMinutes}
        editLabel="Hours"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Hours: 6h' }));
    const input = screen.getByLabelText('Hours');
    expect(input).toHaveProp('placeholder', '6:00');
    await fireEvent.changeText(input, '7,5');
    await fireEvent(input, 'submitEditing');
    expect(onChangeMinutes).toHaveBeenCalledWith(450);
  });

  it('ignores invalid text', async () => {
    const onChangeMinutes = jest.fn();
    await render(
      <Stepper
        valueLabel="6h"
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        decrementLabel="less"
        incrementLabel="more"
        minutes={360}
        onChangeMinutes={onChangeMinutes}
        editLabel="Hours"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Hours: 6h' }));
    await fireEvent.changeText(screen.getByLabelText('Hours'), 'abc');
    await fireEvent(screen.getByLabelText('Hours'), 'blur');
    expect(onChangeMinutes).not.toHaveBeenCalled();
    expect(screen.getByText('6h')).toBeOnTheScreen();
  });
});
