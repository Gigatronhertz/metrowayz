import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import toast from 'react-hot-toast';
import { Upload, X, MapPin, Plus, Trash2 } from 'lucide-react';
import MapPicker from '../../components/vendor/MapPicker';

const CATEGORIES = [
  'Private Chefs',
  'Entertainment',
  'Accommodation',
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

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const VendorServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    serviceType: '',
    shortDescription: '',
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
    isChefService: false,
    pricing: {
      model: 'fixed',
      fixed: {
        basePrice: '',
        pricePerPerson: false
      },
      range: {
        minPrice: '',
        maxPrice: ''
      }
    },
    guestRules: {
      baseGuestLimit: 2,
      maxGuestsAllowed: 20,
      extraGuestFee: ''
    },
    menuParameters: [] as any[],
    addons: [] as Array<{ label: string; price: string }>,
    availability: {
      availableDays: [] as string[],
      timeSlots: [] as Array<{ start: string; end: string }>,
      blockedDates: [] as string[]
    }
  });

  const [uploading, setUploading] = useState(false);

  // Fetch service data if editing
  const { data: serviceData } = useQuery({
    queryKey: ['service-edit', id],
    queryFn: async () => {
      console.log('🔄 Fetching service for edit, ID:', id);
      const result = await vendorApi.service.getServiceForEdit(id!);
      console.log('✅ Service data fetched:', result);
      return result;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (serviceData?.service) {
      const service = serviceData.service;
      setFormData({
        title: service.title || '',
        category: service.category || '',
        serviceType: service.serviceType || '',
        shortDescription: service.shortDescription || '',
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
        isChefService: service.isChefService || false,
        pricing: service.pricing || {
          model: 'fixed',
          fixed: { basePrice: '', pricePerPerson: false },
          range: { minPrice: '', maxPrice: '' }
        },
        guestRules: service.guestRules || {
          baseGuestLimit: 2,
          maxGuestsAllowed: 20,
          extraGuestFee: ''
        },
        menuParameters: service.menuParameters || [],
        addons: service.addons || [],
        availability: service.availability || {
          availableDays: [],
          timeSlots: [],
          blockedDates: []
        }
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
    
    if (name === 'category') {
      const isChef = value === 'Private Chefs';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        isChefService: isChef
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const sectionKey = section as keyof typeof prev;
      const sectionData = prev[sectionKey] as Record<string, any>;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value
        }
      };
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        availableDays: prev.availability.availableDays.includes(day)
          ? prev.availability.availableDays.filter(d => d !== day)
          : [...prev.availability.availableDays, day]
      }
    }));
  };

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: [...prev.availability.timeSlots, { start: '10:00', end: '14:00' }]
      }
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: prev.availability.timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: prev.availability.timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const handleAddMenuParameter = () => {
    setFormData(prev => ({
      ...prev,
      menuParameters: [
        ...prev.menuParameters,
        {
          name: '',
          label: '',
          type: 'single_select',
          options: []
        }
      ]
    }));
  };

  const handleRemoveMenuParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menuParameters: prev.menuParameters.filter((_, i) => i !== index)
    }));
  };

  const handleMenuParameterChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      menuParameters: prev.menuParameters.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const handleAddParameterOption = (paramIndex: number) => {
    setFormData(prev => ({
      ...prev,
      menuParameters: prev.menuParameters.map((param, i) =>
        i === paramIndex
          ? {
              ...param,
              options: [...param.options, { label: '', value: '', priceEffect: 0 }]
            }
          : param
      )
    }));
  };

  const handleRemoveParameterOption = (paramIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      menuParameters: prev.menuParameters.map((param, i) =>
        i === paramIndex
          ? {
              ...param,
              options: param.options.filter((_: any, oi: number) => oi !== optionIndex)
            }
          : param
      )
    }));
  };

  const handleParameterOptionChange = (paramIndex: number, optionIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      menuParameters: prev.menuParameters.map((param, i) =>
        i === paramIndex
          ? {
              ...param,
              options: param.options.map((opt: any, oi: number) =>
                oi === optionIndex ? { ...opt, [field]: value } : opt
              )
            }
          : param
      )
    }));
  };

  const handleAddAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { label: '', price: '' }]
    }));
  };

  const handleRemoveAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const handleAddonChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) =>
        i === index ? { ...addon, [field]: value } : addon
      )
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

    // Basic validation
    if (!formData.title || !formData.category || !formData.description || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    // Chef service specific validation
    if (formData.isChefService) {
      if (!formData.pricing.model) {
        toast.error('Please select a pricing model');
        return;
      }

      if (formData.pricing.model === 'fixed') {
        if (!formData.pricing.fixed.basePrice) {
          toast.error('Please enter a base price');
          return;
        }
      } else if (formData.pricing.model === 'range') {
        if (!formData.pricing.range.minPrice || !formData.pricing.range.maxPrice) {
          toast.error('Please enter min and max price');
          return;
        }
      }

      if (formData.availability.availableDays.length === 0) {
        toast.error('Please select at least one available day');
        return;
      }

      if (formData.availability.timeSlots.length === 0) {
        toast.error('Please add at least one time slot');
        return;
      }
    } else {
      // Regular service validation
      if (!formData.price) {
        toast.error('Please enter a price');
        return;
      }
    }

    const submitData = {
      ...formData,
      price: formData.isChefService ? parseFloat(formData.pricing.fixed.basePrice || formData.pricing.range.minPrice) : parseFloat(formData.price),
      pricing: formData.isChefService ? {
        model: formData.pricing.model,
        fixed: {
          basePrice: parseFloat(formData.pricing.fixed.basePrice) || 0,
          pricePerPerson: formData.pricing.fixed.pricePerPerson
        },
        range: {
          minPrice: parseFloat(formData.pricing.range.minPrice) || 0,
          maxPrice: parseFloat(formData.pricing.range.maxPrice) || 0
        }
      } : undefined,
      guestRules: formData.isChefService ? {
        ...formData.guestRules,
        extraGuestFee: parseFloat(formData.guestRules.extraGuestFee) || 0
      } : undefined,
      menuParameters: formData.isChefService ? formData.menuParameters : undefined,
      addons: formData.isChefService ? formData.addons.map(addon => ({
        ...addon,
        price: parseFloat(addon.price) || 0
      })) : undefined,
      availability: formData.isChefService ? formData.availability : undefined
    };

    console.log('Submitting service data:', submitData);
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

          {/* Amenities - Not for Chef Services */}
          {!formData.isChefService && (
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
          )}

          {/* Chef Service Specific Sections */}
          {formData.isChefService && (
            <>
              {/* Pricing Model */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Model</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Pricing Model *
                    </label>
                    <div className="flex gap-4">
                      {['fixed', 'range'].map(model => (
                        <label key={model} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pricingModel"
                            value={model}
                            checked={formData.pricing.model === model}
                            onChange={() => handleNestedChange('pricing', 'model', model)}
                            className="text-blue-600"
                          />
                          <span className="text-sm font-medium capitalize">{model} Price</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.pricing.model === 'fixed' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price (₦) *
                        </label>
                        <input
                          type="number"
                          value={formData.pricing.fixed.basePrice}
                          onChange={(e) => handleNestedChange('pricing', 'fixed', {
                            ...formData.pricing.fixed,
                            basePrice: e.target.value
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pricing.fixed.pricePerPerson}
                          onChange={(e) => handleNestedChange('pricing', 'fixed', {
                            ...formData.pricing.fixed,
                            pricePerPerson: e.target.checked
                          })}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">Price per person</span>
                      </label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Price (₦) *
                        </label>
                        <input
                          type="number"
                          value={formData.pricing.range.minPrice}
                          onChange={(e) => handleNestedChange('pricing', 'range', {
                            ...formData.pricing.range,
                            minPrice: e.target.value
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Price (₦) *
                        </label>
                        <input
                          type="number"
                          value={formData.pricing.range.maxPrice}
                          onChange={(e) => handleNestedChange('pricing', 'range', {
                            ...formData.pricing.range,
                            maxPrice: e.target.value
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="120000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Rules */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Rules</h2>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Guest Limit
                    </label>
                    <input
                      type="number"
                      value={formData.guestRules.baseGuestLimit}
                      onChange={(e) => handleNestedChange('guestRules', 'baseGuestLimit', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Guests Allowed
                    </label>
                    <input
                      type="number"
                      value={formData.guestRules.maxGuestsAllowed}
                      onChange={(e) => handleNestedChange('guestRules', 'maxGuestsAllowed', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extra Guest Fee (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.guestRules.extraGuestFee}
                      onChange={(e) => handleNestedChange('guestRules', 'extraGuestFee', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Days *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.availability.availableDays.includes(day)}
                            onChange={() => handleDayToggle(day)}
                            className="text-blue-600"
                          />
                          <span className="text-sm font-medium capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Time Slots *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Slot
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.availability.timeSlots.map((slot, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">From</label>
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">To</label>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlot(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Parameters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Menu Parameters</h2>
                  <button
                    type="button"
                    onClick={handleAddMenuParameter}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Parameter
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.menuParameters.map((param, paramIndex) => (
                    <div key={paramIndex} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 grid grid-cols-2 gap-3 mr-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Parameter Name
                            </label>
                            <input
                              type="text"
                              value={param.name}
                              onChange={(e) => handleMenuParameterChange(paramIndex, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., menu_type"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Label
                            </label>
                            <input
                              type="text"
                              value={param.label}
                              onChange={(e) => handleMenuParameterChange(paramIndex, 'label', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Menu Type"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuParameter(paramIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg mt-6"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={param.type}
                          onChange={(e) => handleMenuParameterChange(paramIndex, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="single_select">Single Select</option>
                          <option value="multi_select">Multi Select</option>
                          <option value="boolean">Yes/No</option>
                        </select>
                      </div>

                      {param.type !== 'boolean' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Options</label>
                            <button
                              type="button"
                              onClick={() => handleAddParameterOption(paramIndex)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              + Add Option
                            </button>
                          </div>
                          {param.options.map((option: any, optionIndex: number) => (
                            <div key={optionIndex} className="flex gap-2 items-end bg-gray-50 p-2 rounded">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => handleParameterOptionChange(paramIndex, optionIndex, 'label', e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Label"
                              />
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) => handleParameterOptionChange(paramIndex, optionIndex, 'value', e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Value"
                              />
                              <input
                                type="number"
                                value={option.priceEffect}
                                onChange={(e) => handleParameterOptionChange(paramIndex, optionIndex, 'priceEffect', parseFloat(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Price"
                                step="0.01"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveParameterOption(paramIndex, optionIndex)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add-ons</h2>
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Add-on
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.addons.map((addon, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <input
                        type="text"
                        value={addon.label}
                        onChange={(e) => handleAddonChange(index, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Cocktail Mixing"
                      />
                      <input
                        type="number"
                        value={addon.price}
                        onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

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
