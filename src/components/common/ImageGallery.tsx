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

  // Create a masonry-style layout with different sized images
  const createMasonryLayout = (): ImageItem[] => {
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

  const masonryImages = createMasonryLayout()

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

  const getSizeClasses = (size: 'large' | 'medium' | 'small') => {
    switch (size) {
      case 'large':
        return 'col-span-2 row-span-2'
      case 'medium':
        return 'col-span-1 row-span-2'
      case 'small':
        return 'col-span-1 row-span-1'
    }
  }

  return (
    <>
      {/* Masonry Grid for Desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-4 gap-2 auto-rows-[100px] p-4">
          {masonryImages.map((item) => (
            <div
              key={item.index}
              className={`${getSizeClasses(item.size)} relative overflow-hidden rounded-lg cursor-pointer group`}
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

      {/* Grid for Mobile */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-1 p-2">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded cursor-pointer"
              onClick={() => openModal(index)}
            >
              <img
                src={url || '/placeholder.jpg'}
                alt={`${title} - Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
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