import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../api/review', () => ({
  __esModule: true,
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

jest.mock('../api/reportAPI.js', () => ({
  __esModule: true,
  createReport: jest.fn(),
  checkReportExist: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  __esModule: true,
  jwtDecode: jest.fn(() => ({ userId: 'user-2' })),
}));

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

const ReviewSection = require('./ReviewSection').default;
const reviewApi = require('../api/review');

test('renders a report button for each review', async () => {
  localStorage.setItem('token', 'test-token');
  reviewApi.getBoardingHouseReviews.mockResolvedValueOnce({
    data: [
      {
        _id: 'review-1',
        accountId: { _id: 'user-1', fullname: 'Alice' },
        rating: 5,
        content: 'Great place',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  });

  render(<ReviewSection boardingHouseId="bh-1" />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /report review/i })).toBeTruthy();
  });

  localStorage.clear();
});
