import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import { serviceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, MapPin } from 'lucide-react';
import MapPicker from '../../components/vendor/MapPicker';

const CATEGORIES = [
  'Accommodation',
  'Transportation',
  'Events',
  'Cleaning',
  'Entertainment',
  'Health & Wellness',
  'Professional Services'
];

const PRICE_UNITS = [
  'night',
  'day',
  'hour',
  'event',
  'meal',
  'service'
];

const AMENITIES = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Pool',
  'Gym',
  'Kitchen',
  'Laundry',
  'Pet Friendly',
  'Wheelchair Accessible',
  'Security',
  'Backup Power'
];

const VendorServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    price: '',
    priceUnit: 'night',
    amenities: [] as string[],
    images: [] as Array<{ url: string; publicId: string }>,
    latitude: 0,
    longitude: 0,
    isAvailable: true,
    status: 'active',
  });

  const [uploading, setUploading] = useState(false);

  // Fetch service data if editing
  const { data: serviceData } = useQuery({
    queryKey: ['service', id],
    queryFn: () => serviceAPI.getServiceById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (serviceData?.service) {
      const service = serviceData.service;
      setFormData({
        title: service.title || '',
        category: service.category || '',
        description: service.description || '',
        location: service.location || '',
        price: service.price?.toString() || '',
        priceUnit: service.priceUnit || 'night',
        amenities: service.amenities || [],
        images: service.images || [],
        latitude: service.latitude || 0,
        longitude: service.longitude || 0,
        isAvailable: service.isAvailable !== false,
        status: service.status || 'active',
      });
    }
  }, [serviceData]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return vendorApi.service.updateService(id!, data);
      }
      return vendorApi.service.createService(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Service updated successfully' : 'Service created successfully');
      navigate('/vendor/services');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save service');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Get Cloudinary signature
      const signatureData = await vendorApi.service.getCloudinarySignature();
      const { signature, timestamp, cloudName, apiKey, folder } = signatureData.data;

      const uploadedImages: Array<{ url: string; publicId: string; resourceType: string }> = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        formData.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error('Cloudinary upload error:', data);
          throw new Error(data.error?.message || 'Upload failed');
        }

        if (!data.secure_url || !data.public_id) {
          console.error('Missing data from Cloudinary:', data);
          throw new Error('Invalid response from Cloudinary');
        }

        uploadedImages.push({
          url: data.secure_url,
          publicId: data.public_id,
          resourceType: 'image'
        });
      }

      console.log('Uploaded images:', uploadedImages);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));

      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.category || !formData.description || !formData.location || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
    };

    console.log('Submitting service data:', submitData);
    console.log('Images in submit:', submitData.images);

    mutation.mutate(submitData);
  };

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h1>
          <p className="text-gray-500 mt-1">Fill in the details to list your service</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Luxury 2-Bedroom Apartment"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Lagos, Nigeria"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your service in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Unit *
                  </label>
                  <select
                    name="priceUnit"
                    value={formData.priceUnit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {PRICE_UNITS.map(unit => (
                      <option key={unit} value={unit}>per {unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images * (Max 10)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-sm text-gray-600 mb-4">
                    Click to upload or drag and drop
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading || formData.images.length >= 10}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      uploading || formData.images.length >= 10
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Choose Files'}
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Service ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITIES.map(amenity => (
                <label
                  key={amenity}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Map Location Picker */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Service Location</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on the map to set the exact location of your service. This will help customers find you easily.
            </p>

            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
            />

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  value={formData.latitude}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  step="any"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  value={formData.longitude}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/services')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Saving...' : isEditing ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
};

export default VendorServiceForm;
