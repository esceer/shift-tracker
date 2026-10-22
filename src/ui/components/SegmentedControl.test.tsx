import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
] as const;

describe('SegmentedControl', () => {
  it('marks the selected option and reports changes', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={options} value="quarter" onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'Quarter' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Month' })).not.toBeSelected();

    await fireEvent.press(screen.getByRole('radio', { name: 'Month' }));
    expect(onChange).toHaveBeenCalledWith('month');
  });
});
