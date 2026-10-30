import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Dictionary from '../../app/screens/Dictionary';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('Dictionary Screen', () => {
  it('searches for a word', async () => {
    const { getByPlaceholderText, getAllByText, queryAllByText } = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NavigationContainer>
          <Dictionary />
        </NavigationContainer>
      </SafeAreaProvider>
    );
    const input = getByPlaceholderText('Search in target language or English...');
    fireEvent.changeText(input, 'money');
    await waitFor(() => expect(getAllByText(/money/i).length).toBeGreaterThan(0));
    // An unrelated query filters "money" out again (an empty query shows the full word list).
    fireEvent.changeText(input, 'zzzqqq');
    await waitFor(() => expect(queryAllByText(/money/i).length).toBe(0));
  });
});
