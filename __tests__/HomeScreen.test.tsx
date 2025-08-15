import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Welcome to SpellApp!')).toBeOnTheScreen();
    expect(screen.getByText('This is your home screen.')).toBeOnTheScreen();
  });
});
