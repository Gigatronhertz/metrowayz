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

  const [customServiceType, setCustomServiceType] = useState('');

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
    menuItems: [] as string[],
    addons: [] as Array<{ label: string; price: string }>,
    availability: {
      availableDays: [] as string[],
      timeSlots: [] as Array<{ start: string; end: string }>,
      blockedDates: [] as string[]
    },
    serviceTypeOptions: [] as string[],
    mealPackages: [] as Array<{ label: string; price: string }>,
    additionalNotesOptions: [] as string[]
  });

  const [uploading, setUploading] = useState(false);

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
        menuItems: service.menuItems || [],
        addons: service.addons || [],
        availability: service.availability || {
          availableDays: [],
          timeSlots: [],
          blockedDates: []
        },
        serviceTypeOptions: service.serviceTypeOptions || [],
        mealPackages: service.mealPackages || [],
        additionalNotesOptions: service.additionalNotesOptions || []
      });
    }
  }, [serviceData]);

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

  // New field handlers
  const handleAddServiceTypeOption = () => {
    setFormData(prev => ({
      ...prev,
      serviceTypeOptions: [...prev.serviceTypeOptions, '']
    }));
  };

  const handleRemoveServiceTypeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serviceTypeOptions: prev.serviceTypeOptions.filter((_, i) => i !== index)
    }));
  };

  const handleServiceTypeOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypeOptions: prev.serviceTypeOptions.map((option, i) =>
        i === index ? value : option
      )
    }));
  };

  const handleAddMealPackage = () => {
    setFormData(prev => ({
      ...prev,
      mealPackages: [...prev.mealPackages, { label: '', price: '' }]
    }));
  };

  const handleRemoveMealPackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mealPackages: prev.mealPackages.filter((_, i) => i !== index)
    }));
  };

  const handleMealPackageChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      mealPackages: prev.mealPackages.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const handleAddAdditionalNotesOption = () => {
    setFormData(prev => ({
      ...prev,
      additionalNotesOptions: [...prev.additionalNotesOptions, '']
    }));
  };

  const handleRemoveAdditionalNotesOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalNotesOptions: prev.additionalNotesOptions.filter((_, i) => i !== index)
    }));
  };

  const handleAdditionalNotesOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalNotesOptions: prev.additionalNotesOptions.map((option, i) =>
        i === index ? value : option
      )
    }));
  };

  // Menu Items handlers
  const handleAddMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, '']
    }));
  };

  const handleRemoveMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, i) => i !== index)
    }));
  };

  const handleMenuItemChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.map((item, i) =>
        i === index ? value : item
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
      const signatureData = await vendorApi.service.getCloudinarySignature();
      const { signature, timestamp, cloudName, apiKey, folder } = signatureData.data;

      const uploadedImages: Array<{ url: string; publicId: string; resourceType: string }> = [];

      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('signature', signature);
        formDataUpload.append('timestamp', timestamp.toString());
        formDataUpload.append('api_key', apiKey);
        formDataUpload.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formDataUpload,
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

    if (!formData.title || !formData.category || !formData.description || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

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
      menuItems: formData.isChefService ? formData.menuItems : undefined,
      addons: formData.isChefService ? formData.addons.map(addon => ({
        ...addon,
        price: parseFloat(addon.price) || 0
      })) : undefined,
      availability: formData.isChefService ? formData.availability : undefined,
      serviceTypeOptions: formData.isChefService ? formData.serviceTypeOptions : undefined,
      mealPackages: formData.isChefService ? formData.mealPackages.map(pkg => ({
        ...pkg,
        price: parseFloat(pkg.price) || 0
      })) : undefined,
      additionalNotesOptions: formData.isChefService ? formData.additionalNotesOptions : undefined
    };

    mutation.mutate(submitData);
  };

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h1>
          <p className="text-gray-500 mt-1">Fill in the details to list your service</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Category Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Step 1: Select Service Type</h2>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-base"
              required
            >
              <option value="">Choose a category...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formData.isChefService && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
                ✓ Private Chef form activated
              </div>
            )}
          </div>

          {!formData.category && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-yellow-700">
              <p>Please select a category to continue</p>
            </div>
          )}

          {/* REGULAR SERVICE FORM */}
          {!formData.isChefService && formData.category && (
            <>
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
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">₦</span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 50000"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
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
            </>
          )}

          {/* CHEF SERVICE FORM */}
          {formData.isChefService && (
            <>
              {/* Chef Service Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Chef Service Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type *
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Auto-generate title from service type
                        if (e.target.value && e.target.value !== 'other') {
                          const selectedOption = e.target.options[e.target.selectedIndex];
                          setFormData(prev => ({ ...prev, title: selectedOption.text }));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select service type...</option>
                      <option value="private_dining">Private Fine Dining</option>
                      <option value="outdoor_grill">Outdoor Grill Experience</option>
                      <option value="meal_prep">Meal Prep Service</option>
                      <option value="breakfast">Breakfast Menu</option>
                      <option value="continental">Continental Dinner</option>
                      <option value="dessert">Dessert Menu</option>
                      <option value="corporate">Corporate Lunch</option>
                      <option value="other">Other (Please Specify)</option>
                    </select>
                  </div>

                  {formData.serviceType === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specify Service Type *
                      </label>
                      <input
                        type="text"
                        value={customServiceType}
                        onChange={(e) => {
                          setCustomServiceType(e.target.value);
                          setFormData(prev => ({ ...prev, title: e.target.value }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Brunch Service, Cocktail Party Catering"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your chef service in detail. Example: 'I offer exquisite African-continental fusion cuisine. My 3-course menu includes appetizers, main course with your choice of protein, and decadent desserts. I prepare meals in your kitchen and can handle events for 4-20 guests. Over 8 years experience with corporate events and intimate gatherings.'"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Lagos, Nigeria or 'I travel to client locations'"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Model */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Pricing Model</h2>
                  <p className="text-xs text-gray-500 mt-1">Set how you charge customers for your chef service</p>
                </div>

                {/* Pricing Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-blue-900 mb-2">📊 Pricing Model Explained:</h3>
                  <div className="space-y-2 text-sm text-blue-900">
                    <div className="bg-white rounded p-2 border border-blue-200">
                      <strong>Fixed Price:</strong> One set price for the service (e.g., ₦50,000 flat rate). Best for standard packages.
                    </div>
                    <div className="bg-white rounded p-2 border border-blue-200">
                      <strong>Price Range:</strong> Minimum and maximum price (e.g., ₦50,000 - ₦120,000). Final price depends on menu options selected.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Choose Pricing Type *
                    </label>
                    <div className="flex gap-4">
                      {[
                        { value: 'fixed', label: 'Fixed Price', desc: 'Same price for all bookings (e.g., ₦50,000 per event)' },
                        { value: 'range', label: 'Price Range', desc: 'Price varies based on selections (e.g., ₦50,000 - ₦120,000)' }
                      ].map(model => (
                        <label key={model.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: formData.pricing.model === model.value ? '#3b82f6' : '#d1d5db', backgroundColor: formData.pricing.model === model.value ? '#eff6ff' : 'transparent' }}>
                          <input
                            type="radio"
                            name="pricingModel"
                            value={model.value}
                            checked={formData.pricing.model === model.value}
                            onChange={() => handleNestedChange('pricing', 'model', model.value)}
                            className="text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{model.label}</div>
                            <div className="text-xs text-gray-500">{model.desc}</div>
                          </div>
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
                          placeholder="e.g., 50000"
                          min="0"
                          step="0.01"
                        />
                        <p className="mt-1 text-xs text-gray-500">Example: Enter 50000 for ₦50,000</p>
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
                        <span className="text-sm font-medium text-gray-700">Price per person (multiply by number of guests)</span>
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
                          placeholder="e.g., 50000"
                          min="0"
                          step="0.01"
                        />
                        <p className="mt-1 text-xs text-gray-500">Example: 50000</p>
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
                          placeholder="e.g., 120000"
                          min="0"
                          step="0.01"
                        />
                        <p className="mt-1 text-xs text-gray-500">Example: 120000</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Rules */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-orange-200">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Guest Rules</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure guest capacity and extra guest pricing</p>
                </div>

                {/* Guest Rules Guide */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-orange-900 mb-2">👥 Example Scenario:</h3>
                  <div className="bg-white rounded p-3 border border-orange-200 text-sm">
                    <p className="text-gray-900 mb-2">
                      <strong>Base Guest Limit: 2</strong> → Base price includes up to 2 guests<br />
                      <strong>Max Guests: 20</strong> → You can serve up to 20 people total<br />
                      <strong>Extra Guest Fee: ₦5,000</strong> → Each guest beyond 2 costs ₦5,000
                    </p>
                    <div className="mt-2 pt-2 border-t border-orange-200 text-orange-900">
                      💰 <strong>Example:</strong> If customer books for 6 guests → Base price + (4 extra × ₦5,000) = Base + ₦20,000
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
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
                        placeholder="e.g., 2"
                        min="1"
                      />
                      <p className="mt-1 text-xs text-gray-500">Example: 2 (guests included in base price)</p>
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
                        placeholder="e.g., 20"
                        min="1"
                      />
                      <p className="mt-1 text-xs text-gray-500">Example: 20 (maximum total guests)</p>
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
                        placeholder="e.g., 5000"
                        min="0"
                        step="0.01"
                      />
                      <p className="mt-1 text-xs text-gray-500">Example: 5000 (per extra guest)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-indigo-200">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Availability</h2>
                  <p className="text-xs text-gray-500 mt-1">Set when you're available to provide chef services</p>
                </div>

                {/* Availability Guide */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-indigo-900 mb-2">📅 Setting Your Availability:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white rounded p-2 border border-indigo-200 text-gray-900">
                      <strong>Available Days:</strong> Select which days you work (e.g., Monday-Saturday)
                    </div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-gray-900">
                      <strong>Time Slots:</strong> Your working hours for each day
                      <div className="ml-4 mt-1 text-xs text-indigo-900">
                        • Example: 10:00-14:00 (Morning shift), 18:00-22:00 (Evening shift)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Days *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
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
                        Time Slots * (Working Hours)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-medium shadow-sm"
                      >
                        <Plus size={16} /> Add Time Slot
                      </button>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2 mb-3 text-xs">
                      <strong className="text-indigo-900">💡 Examples:</strong>
                      <div className="text-indigo-800 mt-1 space-y-0.5">
                        • Morning: 10:00-14:00 (Lunch service)
                        • Evening: 18:00-22:00 (Dinner service)
                      </div>
                    </div>
                    <div className="space-y-2">
                      {formData.availability.timeSlots.length === 0 ? (
                        <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded">No time slots added yet. Click "Add Slot" to add your working hours.</p>
                      ) : (
                        formData.availability.timeSlots.map((slot, index) => (
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <p className="text-xs text-gray-500 mt-1">Add menu items that match your selected service type</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Add Menu Item
                  </button>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                    Menu Examples:
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Jollof Rice</div>
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Basmati Rice</div>
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Fried Rice</div>
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Grilled Chicken</div>
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Fish Pepper Soup</div>
                    <div className="bg-white rounded p-2 border border-purple-200 text-purple-900">Egusi Soup</div>
                  </div>
                  <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-900">
                    💡 <strong>Tip:</strong> Add menu items that are available for your selected service type (e.g., breakfast items for Breakfast service).
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.menuItems.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">No menu items yet. Click "Add Menu Item" to add dishes to your menu.</p>
                  ) : (
                    formData.menuItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleMenuItemChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Jollof Rice, Basmati Rice, Grilled Chicken"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuItem(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add-ons */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add-ons (Optional)</h2>
                    <p className="text-xs text-gray-500 mt-1">Extra services customers can add for additional cost</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Add Add-on
                  </button>
                </div>

                {/* Example Guide */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                    Add-on Examples:
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded p-2 border border-green-200">
                      <strong>Cocktail Mixing Service</strong> - ₦25,000
                    </div>
                    <div className="bg-white rounded p-2 border border-green-200">
                      <strong>Professional Waiters (2)</strong> - ₦15,000
                    </div>
                    <div className="bg-white rounded p-2 border border-green-200">
                      <strong>Dessert Platter</strong> - ₦10,000
                    </div>
                    <div className="bg-white rounded p-2 border border-green-200">
                      <strong>Live Cooking Station</strong> - ₦20,000
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-900">
                    ⚠️ <strong>Note:</strong> Add-ons are completely optional - customers can book without selecting any.
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.addons.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">No add-ons yet. Click "Add Add-on" to create optional services that customers can add for extra cost.</p>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-green-900">
                          <div>Add-on Service Name</div>
                          <div className="text-right">Price (₦)</div>
                        </div>
                      </div>
                      {formData.addons.map((addon, index) => (
                        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={addon.label}
                              onChange={(e) => handleAddonChange(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="e.g., Cocktail Mixing Service, Professional Waiters"
                            />
                          </div>
                          <div className="w-40">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₦</span>
                              <input
                                type="number"
                                value={addon.price}
                                onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-green-500"
                                placeholder="25000"
                                min="0"
                                step="1000"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddon(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Service Type Options */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Service Type Options</h2>
                    <p className="text-xs text-gray-500 mt-1">Categories for customers to choose from (e.g., Breakfast, Lunch, Dinner)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddServiceTypeOption}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Add Option
                  </button>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                    Examples:
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Breakfast</div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Lunch</div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Dinner</div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Brunch</div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Full Day Service</div>
                    <div className="bg-white rounded p-2 border border-indigo-200 text-indigo-900">Event Catering</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.serviceTypeOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">No service type options yet. Click "Add Option" to create service categories.</p>
                  ) : (
                    formData.serviceTypeOptions.map((option, index) => (
                      <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleServiceTypeOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Breakfast, Lunch, Dinner"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceTypeOption(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Meal Packages */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Meal Packages</h2>
                    <p className="text-xs text-gray-500 mt-1">Simplified meal selection with pricing (e.g., 3-Course Meal - ₦50,000)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMealPackage}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Add Package
                  </button>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                    Examples:
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded p-2 border border-orange-200">
                      <strong>3-Course Meal</strong> - ₦50,000
                    </div>
                    <div className="bg-white rounded p-2 border border-orange-200">
                      <strong>5-Course Meal</strong> - ₦80,000
                    </div>
                    <div className="bg-white rounded p-2 border border-orange-200">
                      <strong>Light Breakfast</strong> - ₦25,000
                    </div>
                    <div className="bg-white rounded p-2 border border-orange-200">
                      <strong>Full Buffet</strong> - ₦120,000
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.mealPackages.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">No meal packages yet. Click "Add Package" to create meal options with pricing.</p>
                  ) : (
                    <>
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-orange-900">
                          <div>Meal Package Name</div>
                          <div className="text-right">Price (₦)</div>
                        </div>
                      </div>
                      {formData.mealPackages.map((pkg, index) => (
                        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={pkg.label}
                              onChange={(e) => handleMealPackageChange(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                              placeholder="e.g., 3-Course Meal, Light Breakfast"
                            />
                          </div>
                          <div className="w-40">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₦</span>
                              <input
                                type="number"
                                value={pkg.price}
                                onChange={(e) => handleMealPackageChange(index, 'price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500"
                                placeholder="50000"
                                min="0"
                                step="1000"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMealPackage(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Additional Notes Options */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-teal-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Additional Notes Options</h2>
                    <p className="text-xs text-gray-500 mt-1">Dietary preferences and restrictions for customers to select</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdditionalNotesOption}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Add Option
                  </button>
                </div>

                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-teal-900 mb-2 flex items-center gap-2">
                    <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                    Examples:
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">Vegetarian</div>
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">Vegan</div>
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">Gluten-free</div>
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">No Pork</div>
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">Halal Only</div>
                    <div className="bg-white rounded p-2 border border-teal-200 text-teal-900">Nut Allergies</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.additionalNotesOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">No additional notes options yet. Click "Add Option" to create dietary preferences.</p>
                  ) : (
                    formData.additionalNotesOptions.map((option, index) => (
                      <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleAdditionalNotesOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g., Vegetarian, Gluten-free, No Pork"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalNotesOption(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Shared Sections: Images and Location */}
          {formData.category && (
            <>
              {/* Images */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Images</h2>

                <div className="space-y-4">
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

              {/* Location */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Service Location</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Click on the map to set the exact location of your service.
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
            </>
          )}
        </form>
      </div>
    </VendorLayout>
  );
};

export default VendorServiceForm;
