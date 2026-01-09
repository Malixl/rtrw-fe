/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EnvironmentFilled } from '@ant-design/icons';

const MapLoader = ({ isLoaded, onFinished }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;

    if (progress < 90) {
      // 1. Simulasi loading awal (0% -> 90%)
      // Jalan agak cepat di awal, melambat di akhir
      const timeout = Math.random() * 200 + 50;
      interval = setTimeout(() => {
        setProgress((prev) => {
          // Tambah angka random kecil agar terlihat natural
          const increment = Math.floor(Math.random() * 5) + 1;
          return Math.min(prev + increment, 90);
        });
      }, timeout);
    }

    // 2. Jika data sudah siap (isLoaded = true), kebut ke 100%
    if (isLoaded) {
      setProgress(100);
    }

    return () => clearTimeout(interval);
  }, [progress, isLoaded]);

  // 3. Jika sudah 100%, beri jeda sedikit lalu panggil onFinished
  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        onFinished?.();
      }, 800); // Tahan 0.8 detik di 100% biar user lihat "Sukses"
      return () => clearTimeout(timer);
    }
  }, [progress, onFinished]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md"
      exit={{ opacity: 0, y: -50 }} // Animasi hilang ke atas
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Container Icon & Animasi */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Lingkaran Radar/Riak di belakang */}
        <motion.div
          className="absolute h-32 w-32 rounded-full border-4 border-blue-100"
          animate={{
            scale: [1, 1.5],
            opacity: [1, 0],
            borderWidth: ['4px', '0px']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />

        {/* Ikon Peta Melompat */}
        <motion.div
          className="text-7xl text-blue-600 drop-shadow-2xl"
          animate={{
            y: [-20, 0, -20], // Melompat
            scale: [1.1, 0.9, 1.1] // Squish effect saat mendarat
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <EnvironmentFilled />
        </motion.div>

        {/* Bayangan di bawah icon */}
        <motion.div
          className="absolute -bottom-4 h-3 w-10 rounded-full bg-black/10 blur-sm"
          animate={{
            scaleX: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Teks Persentase Besar */}
      <div className="mb-2 text-4xl font-black text-gray-800">{progress}%</div>

      {/* Progress Bar Container */}
      <div className="relative h-3 w-64 overflow-hidden rounded-full bg-gray-200">
        {/* Progress Bar Fill */}
        <motion.div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ ease: 'linear' }} />
      </div>

      {/* Status Text */}
      <p className="mt-4 animate-pulse text-sm font-medium text-gray-500">
        {progress < 30 && 'Menghubungkan ke satelit...'}
        {progress >= 30 && progress < 70 && 'Memuat lapisan wilayah...'}
        {progress >= 70 && progress < 100 && 'Menyusun peta tata ruang...'}
        {progress === 100 && 'Peta Siap Jelajahi!'}
      </p>
    </motion.div>
  );
};

export default MapLoader;
