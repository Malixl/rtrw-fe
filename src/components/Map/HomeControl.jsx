import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

/**
 * HomeControl - Custom Leaflet control button to navigate back to home
 * Positioned above the LayersControl (topright)
 */
const HomeControl = () => {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    // Create custom control
    const HomeControlClass = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'Kembali ke Beranda';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Kembali ke Beranda');

        // Style the button
        button.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          background-color: white;
          color: #333;
          font-size: 18px;
          text-decoration: none;
          cursor: pointer;
        `;

        // Home icon (SVG)
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        `;

        // Hover effect
        button.onmouseover = function () {
          this.style.backgroundColor = '#f4f4f4';
        };
        button.onmouseout = function () {
          this.style.backgroundColor = 'white';
        };

        // Click handler
        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          navigate('/');
        });

        // Prevent map interactions when clicking the control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      }
    });

    const homeControl = new HomeControlClass();
    map.addControl(homeControl);

    // Cleanup on unmount
    return () => {
      map.removeControl(homeControl);
    };
  }, [map, navigate]);

  return null;
};

export default HomeControl;
