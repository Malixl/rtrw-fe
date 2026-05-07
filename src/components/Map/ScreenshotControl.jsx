import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { message, Modal, Button as AntButton } from 'antd';
import { CameraOutlined, PrinterOutlined } from '@ant-design/icons';

/**
 * ScreenshotControl - Custom Leaflet control button to capture/print the current map view
 * Positioned at topleft, above the Home button (Leaflet stacks controls top-down)
 * Used for generating RTRW report outputs
 */
const ScreenshotControl = () => {
  const map = useMap();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!map) return;

    const ScreenshotClass = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'Cetak / Screenshot Peta';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Cetak atau Screenshot Peta');

        // Style the button
        button.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background-color: white;
          color: #333;
          font-size: 18px;
          text-decoration: none;
          cursor: pointer;
        `;

        // Print/Camera icon (SVG)
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        `;

        // Hover effect
        button.onmouseover = function () {
          this.style.backgroundColor = '#f4f4f4';
        };
        button.onmouseout = function () {
          this.style.backgroundColor = 'white';
        };

        // Click handler - open modal
        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          setIsModalOpen(true);
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      }
    });

    const control = new ScreenshotClass();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map]);

  const handleScreenshot = () => {
    setIsModalOpen(false);
    const hide = message.loading('Mengambil screenshot peta...', 0);

    // Beri waktu sejenak agar animasi modal selesai tertutup sebelum mengambil screenshot
    setTimeout(async () => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        const captureElement = document.getElementById('map-capture-container') || map.getContainer();
        const canvas = await html2canvas(captureElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2, // Higher resolution for report quality
          logging: false
        });

        // Generate filename with date
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const filename = `Peta_RTRW_Gorontalo_${dateStr}.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();

        hide();
        message.success('Screenshot peta berhasil disimpan!');
      } catch (err) {
        hide();
        console.error('Screenshot error:', err);
        message.error('Gagal mengambil screenshot peta.');
      }
    }, 300);
  };

  const handlePrint = () => {
    setIsModalOpen(false);
    const hide = message.loading('Menyiapkan dokumen cetak...', 0);

    // Beri waktu sejenak agar animasi modal tertutup
    setTimeout(async () => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        const captureElement = document.getElementById('map-capture-container') || map.getContainer();
        const canvas = await html2canvas(captureElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2, // Kualitas tinggi
          logging: false
        });

        // Buat window baru khusus untuk print gambar hasil render
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          hide();
          message.error('Gagal membuka jendela print. Mohon izinkan popup di browser Anda.');
          return;
        }

        const imgData = canvas.toDataURL('image/png');
        
        // Tulis HTML dasar dengan gambar peta
        printWindow.document.write(`
          <html>
            <head>
              <title>Cetak Peta RTRW</title>
              <style>
                @page { size: landscape; margin: 0; }
                body { margin: 0; padding: 0; background: white; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();

        hide();
      } catch (err) {
        hide();
        console.error('Print error:', err);
        message.error('Gagal menyiapkan dokumen cetak.');
      }
    }, 300);
  };

  return (
    <Modal
      title="Opsi Output Peta"
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={null}
      centered
      width={320}
      getContainer={() => document.getElementById('map-wrapper-section') || document.body}
    >
      <div className="flex flex-col gap-3 py-4">
        <AntButton 
          type="primary" 
          icon={<CameraOutlined />} 
          size="large" 
          onClick={handleScreenshot}
          className="flex w-full items-center justify-center font-medium"
        >
          Simpan sebagai Gambar (SS)
        </AntButton>
        <AntButton 
          icon={<PrinterOutlined />} 
          size="large" 
          onClick={handlePrint}
          className="flex w-full items-center justify-center font-medium"
        >
          Cetak Halaman (Print)
        </AntButton>
      </div>
    </Modal>
  );
};

export default ScreenshotControl;
