import { render, screen, waitFor } from '@testing-library/react';
import ReviewSection from './ReviewSection';

jest.mock('../api/review', () => ({
  getBoardingHouseReviews: jest.fn().mockResolvedValue({
    data: [
      {
        _id: 'review-1',
        accountId: { _id: 'user-1', fullname: 'Alice' },
        rating: 5,
        content: 'Great place',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  }),
  addReview: jest.fn(),
  updateReview: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({ userId: 'user-2' })),
}));

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

test('renders a report button for each review', async () => {
  render(<ReviewSection boardingHouseId="bh-1" />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /report review/i })).toBeInTheDocument();
  });
});
