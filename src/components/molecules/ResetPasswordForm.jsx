import { useState } from 'react';
import PropTypes from 'prop-types';
import { MailOutlined } from '@ant-design/icons';
import FormField from './FormField';
import Button from '../atoms/Button';
import { Link } from 'react-router-dom';

const ResetPasswordForm = ({ onSubmit, loading = false }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validate = () => {
    if (!email) {
      setError('Email wajib diisi');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email tidak valid');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6 text-center">
        <p className="text-gray-600">Masukkan email Anda dan kami akan mengirimkan link untuk reset password</p>
      </div>

      <FormField label="Email" name="email" type="email" placeholder="nama@email.com" value={email} onChange={handleChange} error={error} required prefix={<MailOutlined className="text-gray-400" />} />

      <Button type="submit" variant="primary" size="large" fullWidth loading={loading}>
        Kirim Link Reset
      </Button>

      <p className="text-center text-sm text-gray-600">
        Kembali ke{' '}
        <Link to="/auth/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
          Halaman Login
        </Link>
      </p>
    </form>
  );
};

ResetPasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ResetPasswordForm;
