import React, { useState, useEffect } from 'react';
import { fetchMarkerImage } from '@/utils/fetchMarkerImage';

/**
 * SecureImage Component
 * 
 * Komponen image replacement yang otomatis handle fetch secure untuk Ngrok
 * Menggunakan fetchMarkerImage untuk mendapatkan blob URL
 */
const SecureImage = ({ src, alt, className, style, ...props }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        if (!src) {
            setIsLoading(false);
            return;
        }

        const loadImage = async () => {
            try {
                setIsLoading(true);
                const blobUrl = await fetchMarkerImage(src);
                if (isMounted) {
                    setImageSrc(blobUrl);
                    setIsLoading(false);
                }
            } catch (error) {
                console.warn('SecureImage load failed:', error);
                if (isMounted) {
                    setHasError(true);
                    setIsLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [src]);

    if (hasError) {
        // Fallback or broken image placeholder
        return (
            <div 
                className={`bg-gray-200 flex items-center justify-center text-gray-400 text-xs ${className}`} 
                style={{ width: style?.width || '20px', height: style?.height || '20px', ...style }}
                {...props}
            >
                !
            </div>
        );
    }

    return (
        <img 
            src={imageSrc} 
            alt={alt} 
            className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
            style={style}
            onError={() => setHasError(true)}
            {...props} 
        />
    );
};

export default SecureImage;
