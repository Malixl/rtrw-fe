import { InputType } from '@/constants';
import Role from '@/constants/Role';

/**
 * Form fields for User CRUD operations
 * @param {Object} params
 * @param {boolean} [params.isEdit=false] - Whether this is for edit mode (password optional)
 * @returns {import('@/types').FormField[]}
 */
export const formFields = ({ isEdit = false } = {}) => [
  {
    name: 'name',
    label: 'Nama',
    type: InputType.TEXT,
    placeholder: 'Masukkan nama',
    rules: [{ required: true, message: 'Nama harus diisi' }]
  },
  {
    name: 'email',
    label: 'Email',
    type: InputType.TEXT,
    placeholder: 'Masukkan email',
    rules: [
      { required: true, message: 'Email harus diisi' },
      { type: 'email', message: 'Format email tidak valid' }
    ]
  },
  {
    name: 'password',
    label: isEdit ? 'Password Baru (kosongkan jika tidak ingin mengubah)' : 'Password',
    type: InputType.PASSWORD,
    placeholder: isEdit ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password',
    rules: isEdit
      ? [{ min: 8, message: 'Password minimal 8 karakter' }]
      : [
          { required: true, message: 'Password harus diisi' },
          { min: 8, message: 'Password minimal 8 karakter' }
        ]
  },
  {
    name: 'password_confirmation',
    label: 'Konfirmasi Password',
    type: InputType.PASSWORD,
    placeholder: 'Konfirmasi password',
    rules: [
      ({ getFieldValue }) => ({
        validator(_, value) {
          const password = getFieldValue('password');
          if (!password && !value) {
            return Promise.resolve();
          }
          if (password && !value) {
            return Promise.reject(new Error('Konfirmasi password harus diisi'));
          }
          if (password !== value) {
            return Promise.reject(new Error('Password tidak sama'));
          }
          return Promise.resolve();
        }
      })
    ]
  },
  {
    name: 'role',
    label: 'Role',
    type: InputType.SELECT,
    placeholder: 'Pilih role',
    rules: [{ required: true, message: 'Role harus dipilih' }],
    options: [
      { label: 'Admin', value: Role.ADMIN },
      { label: 'OPD', value: Role.OPD }
    ]
  }
];
