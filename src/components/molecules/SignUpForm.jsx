import { useState } from 'react';
import PropTypes from 'prop-types';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import FormField from './FormField';
import Button from '../atoms/Button';
import { Link } from 'react-router-dom';

const SignUpForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Nama lengkap wajib diisi';
    }

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email tidak valid';
    }

    if (!formData.phone) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Nama Lengkap" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} required prefix={<UserOutlined className="text-gray-400" />} />

      <FormField label="Email" name="email" type="email" placeholder="nama@email.com" value={formData.email} onChange={handleChange} error={errors.email} required prefix={<MailOutlined className="text-gray-400" />} />

      <FormField label="Nomor Telepon" name="phone" type="tel" placeholder="08123456789" value={formData.phone} onChange={handleChange} error={errors.phone} required prefix={<PhoneOutlined className="text-gray-400" />} />

      <FormField label="Password" name="password" type="password" placeholder="Minimal 6 karakter" value={formData.password} onChange={handleChange} error={errors.password} required prefix={<LockOutlined className="text-gray-400" />} />

      <FormField
        label="Konfirmasi Password"
        name="confirmPassword"
        type="password"
        placeholder="Masukkan password lagi"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
        prefix={<LockOutlined className="text-gray-400" />}
      />

      <div className="pt-2">
        <Button type="submit" variant="primary" size="large" fullWidth loading={loading}>
          Daftar
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link to="/auth/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
};

SignUpForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default SignUpForm;
