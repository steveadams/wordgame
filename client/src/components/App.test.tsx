import { render } from '@testing-library/react';
import { expect, describe, it } from 'vitest';

import App from './App';

describe('test', () => {
  it('passes', () => {
    render(<App />);

    expect(true).toBeTruthy();
  });
});
