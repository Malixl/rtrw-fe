import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EnvironmentOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Periode', to: '/periode' },
  { label: 'Berita', to: '/berita' },
  { label: 'Map', to: '/map' }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-gray-200/60 bg-white/85 px-4 shadow-sm backdrop-blur-md transition-all duration-300">
      <div className="container-custom py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="group inline-flex items-center gap-2">
            <span className="rounded-lg border border-gray-200 bg-white p-2 text-primary-600 shadow-sm transition-transform group-hover:scale-110">
              <EnvironmentOutlined className="text-xl" />
            </span>
            <span className="font-display bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-base font-bold text-transparent md:text-xl">RTRW Provinsi Gorontalo</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="text-sm font-medium text-gray-700 transition-colors hover:text-primary-600">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* <Link
              to="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Masuk
            </Link> */}
            <Link to="/auth/login" className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:shadow-lg">
              Masuk
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/70 backdrop-blur transition hover:bg-white md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`overflow-hidden transition-[max-height] duration-300 md:hidden ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="container-custom pb-4">
          <nav className="grid gap-2">
            {navLinks.map((link) => (
              <a key={link.label} href={link.to} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link to="/login" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold hover:bg-gray-50">
              Masuk
            </Link>
            <Link to="/signup" className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2 text-center text-sm font-semibold text-white">
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
