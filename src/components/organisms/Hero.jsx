import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { EnvironmentOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

// Image sources: local files downloaded from Wikimedia Commons (preferred). Remote fallbacks point to the original Wikimedia file URLs.
const IMAGE_SOURCES = [
  {
    local: '/image_asset/gorontalo-1.jpg',
    remote: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Pulau_Saronde.jpg',
    author: 'Marwan Mohamad',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Pulau_Saronde.jpg'
  },
  {
    local: '/image_asset/gorontalo-2.jpg',
    remote: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Kapal_Phinisi_berlabuh_di_perairan_lepas_pantai_Biluhu.jpg',
    author: 'Marwan Mohamad',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Kapal_Phinisi_berlabuh_di_perairan_lepas_pantai_Biluhu.jpg'
  },
  {
    local: '/image_asset/gorontalo-3.jpg',
    remote: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Gunung_Tilongkabila.jpg',
    author: 'Marwan Mohamad',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Gunung_Tilongkabila.jpg'
  },
  {
    local: '/image_asset/gorontalo-4.jpg',
    remote: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Sunrise_in_Gorontalo.jpg',
    author: 'Nurul Iin Pratiwi',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sunrise_in_Gorontalo.jpg'
  },
  {
    local: '/image_asset/gorontalo-5.jpg',
    remote: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Pantai_Rabua%2C_Gorontalo_Utara.jpg',
    author: 'Nurul Istiqamah Kadekoh',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Pantai_Rabua,_Gorontalo_Utara.jpg'
  }
];

const Hero = ({ title, subtitle, description }) => {
  const imageSources = IMAGE_SOURCES;

  const [current, setCurrent] = useState(0);
  const [finalUrls, setFinalUrls] = useState([]);
  const DISPLAY_MS = 6000; // time each image is visible in ms

  useEffect(() => {
    let active = true;

    async function resolve() {
      const resolved = await Promise.all(
        IMAGE_SOURCES.map(async ({ local, remote }) => {
          try {
            // Try to HEAD the local file; if available, use it. If not, fallback to remote.
            const res = await fetch(local, { method: 'HEAD' });
            if (res && res.ok) return local;
          } catch {
            // network error - fallback
          }
          return remote;
        })
      );

      if (!active) return;
      setFinalUrls(resolved);

      // Preload resolved images
      resolved.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }

    resolve();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!finalUrls || !finalUrls.length) return;
    const id = setInterval(() => setCurrent((s) => (s + 1) % finalUrls.length), DISPLAY_MS);
    return () => clearInterval(id);
  }, [finalUrls]);

  // Controls removed: autoplay-only slideshow (prev/next/buttons were removed per request)

  return (
    <AntHeader className="relative h-auto overflow-hidden p-0">
      {/* Background Image with Overlay - Crossfading slideshow */}
      <div className="absolute inset-0 z-0">
        {/* Render layers using resolved finalUrls with graceful fallback to remote sources */}
        {(finalUrls && finalUrls.length ? finalUrls : imageSources.map((s) => s.remote)).map((src, i) => {
          const isActive = i === current;
          return (
            <div
              key={src}
              className={`absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out`}
              style={{
                backgroundImage: `url('${src}')`,
                filter: 'blur(1.5px)',
                opacity: isActive ? 1 : 0
              }}
              aria-hidden="true"
            />
          );
        })}

        <div className="from-primary-900/92 via-primary-800/88 to-primary-900/92 absolute inset-0 bg-gradient-to-br"></div>
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Visible attribution credit (bottom-left) */}
        <div className="pointer-events-auto absolute bottom-4 left-4 z-30">
          {IMAGE_SOURCES[current] && (
            <a href={IMAGE_SOURCES[current].page} target="_blank" rel="noreferrer noopener" className="text-xs text-white/80 hover:text-white">
              Photo: {IMAGE_SOURCES[current].author} · {IMAGE_SOURCES[current].license}
            </a>
          )}
        </div>
      </div>

      {/* Decorative elements - Hidden on mobile */}
      <div className="absolute inset-0 z-[1] hidden opacity-10 md:block">
        <div className="animate-float absolute right-20 top-20 h-72 w-72 rounded-full bg-white blur-3xl lg:h-96 lg:w-96"></div>
        <div className="animate-float absolute bottom-20 left-20 h-64 w-64 rounded-full bg-accent-400 blur-3xl lg:h-80 lg:w-80" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container-custom relative z-10 py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Icon Badge */}
          <div className="animate-slide-down mb-6 inline-flex items-center justify-center sm:mb-8">
            <div className="rounded-full border border-white/30 bg-white/20 px-4 py-2 shadow-lg backdrop-blur-md sm:px-6 sm:py-3">
              <div className="flex items-center gap-2 text-white">
                <EnvironmentOutlined className="text-lg sm:text-2xl" />
                <span className="text-xs font-semibold uppercase tracking-wide sm:text-sm">Website RTRW</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display animate-slide-up mb-3 px-4 text-4xl font-bold leading-tight text-white sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl">{title}</h1>

          {/* Subtitle */}
          <h2 className="font-display animate-slide-up mb-6 px-4 text-2xl font-semibold text-primary-300 sm:mb-8 sm:text-3xl md:text-4xl lg:text-5xl" style={{ animationDelay: '0.1s' }}>
            {subtitle}
          </h2>

          {/* Description */}
          <p className="animate-slide-up mx-auto mb-8 max-w-3xl px-4 text-base leading-relaxed text-blue-50 sm:mb-10 sm:text-lg md:text-xl" style={{ animationDelay: '0.2s' }}>
            {description}
          </p>

          {/* CTA Button */}
          <div className="animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => {
                const nextSection = document.getElementById('tentang');
                if (nextSection) {
                  nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
              className="shadow-elegant hover:shadow-elegant-hover group inline-flex transform items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-primary-700 transition-all duration-300 hover:scale-105 sm:px-8 sm:py-4 sm:text-lg"
            >
              <span>Jelajahi Lebih Lanjut</span>
              <ArrowDownOutlined className="transition-transform duration-300 group-hover:translate-y-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-[-30px] left-0 right-0 z-10">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full" preserveAspectRatio="none">
          <path
            d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="#f8fafc"
          />
        </svg>
      </div>
    </AntHeader>
  );
};

Hero.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

export default Hero;
