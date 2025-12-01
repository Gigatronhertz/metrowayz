import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  title: string
}

interface ImageItem {
  url: string
  size: 'large' | 'medium' | 'small'
  index: number
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const createHorizontalLayout = (): ImageItem[] => {
    const layout: ImageItem[] = []
    const sizePattern = ['large', 'medium', 'small', 'medium', 'large', 'small', 'medium', 'large']
    
    images.forEach((url, index) => {
      layout.push({
        url,
        size: sizePattern[index % sizePattern.length] as 'large' | 'medium' | 'small',
        index
      })
    })
    
    return layout
  }

  const horizontalImages = createHorizontalLayout()

  const openModal = (index: number) => {
    setSelectedImageIndex(index)
  }

  const closeModal = () => {
    setSelectedImageIndex(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return
    
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => prev === 0 ? images.length - 1 : prev! - 1)
    } else {
      setSelectedImageIndex((prev) => (prev! + 1) % images.length)
    }
  }

  return (
    <>
      {/* Justified Horizontal Collage for Desktop - Fills all space */}
      <div className="hidden lg:block">
        <div className="h-96 bg-gray-100 overflow-hidden">
          <div className="flex h-full gap-1 p-1">
            {horizontalImages.map((item) => (
              <div
                key={item.index}
                className="relative overflow-hidden rounded-lg cursor-pointer group transition-all duration-300"
                style={{
                  flex: item.size === 'large' ? '1.5' : item.size === 'medium' ? '1' : '0.6'
                }}
                onClick={() => openModal(item.index)}
              >
                <img
                  src={item.url || '/placeholder.jpg'}
                  alt={`${title} - Image ${item.index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Single-Frame View for Mobile */}
      <div className="lg:hidden bg-gray-100">
        <div className="overflow-x-auto snap-x snap-mandatory flex h-96">
          {images.map((url, index) => (
            <div
              key={index}
              className="w-full h-full flex-shrink-0 snap-center relative overflow-hidden cursor-pointer"
              onClick={() => openModal(index)}
            >
              <img
                src={url || '/placeholder.jpg'}
                alt={`${title} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 active:scale-105"
              />
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                {index + 1} / {images.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={images[selectedImageIndex] || '/placeholder.jpg'}
                alt={`${title} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGallery