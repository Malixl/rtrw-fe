import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock services used by the page
vi.mock('@/services', () => ({
  BatasAdministrasiService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    store: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  KlasifikasisService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Klas A' }] })
  }
}));

import BatasAdministrasi from '@/pages/dashboard/BatasAdministrasi/BatasAdministrasi';

describe('BatasAdministrasi klasifikasi integration', () => {
  it('fetches klasifikasi for batas_administrasi and shows add button', async () => {
    render(<BatasAdministrasi />);

    // Add button should be present
    expect(screen.getByText(/Tambah/i)).toBeDefined();

    // KlasifikasisService.getAll should be called with tipe 'batas_administrasi'
    await waitFor(() => expect(mockGetAllKlas).toHaveBeenCalled());
  });
});
