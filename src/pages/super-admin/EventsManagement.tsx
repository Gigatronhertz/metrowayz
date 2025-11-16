import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import superAdminApi from '../../services/super-admin/superAdminApi';
import vendorApi from '../../services/vendor/vendorApi';
import MapPicker from '../../components/vendor/MapPicker';
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Users, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EVENT_CATEGORIES = ['Music', 'Comedy', 'Sports', 'Conference', 'Festival', 'Theater', 'Art', 'Food & Drink'];

const EventsManagement = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    venue: '',
    latitude: 0,
    longitude: 0,
    ticketPrice: '',
    category: 'Music',
    capacity: '',
    image: null as { url: string; publicId: string } | null,
    featured: false,
  });

  // Fetch events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['super-admin-events'],
    queryFn: async () => {
      const events = await superAdminApi.events.getAllEvents();
      console.log('📸 Fetched events in super admin:', events);
      console.log('📸 First event image:', events[0]?.image);
      console.log('📸 First event images array:', events[0]?.images);
      return events;
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => superAdminApi.events.createEvent(data),
    onSuccess: () => {
      toast.success('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin-events'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      superAdminApi.events.updateEvent(id, data),
    onSuccess: () => {
      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin-events'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to update event');
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.events.deleteEvent(id),
    onSuccess: () => {
      toast.success('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin-events'] });
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });

  const handleOpenModal = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventDate: event.eventDate ? format(new Date(event.eventDate), 'yyyy-MM-dd') : '',
        eventTime: event.eventTime || '',
        location: event.location || '',
        venue: event.venue || '',
        latitude: event.latitude || 0,
        longitude: event.longitude || 0,
        ticketPrice: event.ticketPrice?.toString() || '',
        category: event.category || 'Music',
        capacity: event.capacity?.toString() || '',
        image: event.image || null,
        featured: event.featured || false,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        location: '',
        venue: '',
        latitude: 0,
        longitude: 0,
        ticketPrice: '',
        category: 'Music',
        capacity: '',
        image: null,
        featured: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      venue: '',
      latitude: 0,
      longitude: 0,
      ticketPrice: '',
      category: 'Music',
      capacity: '',
      image: null,
      featured: false,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Get Cloudinary signature - SAME AS VENDOR SERVICE FORM
      const signatureData = await vendorApi.service.getCloudinarySignature();
      const { signature, timestamp, cloudName, apiKey, folder } = signatureData.data;

      console.log('📸 Cloudinary credentials:', { cloudName, apiKey, folder });

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('signature', signature);
      uploadFormData.append('timestamp', timestamp.toString());
      uploadFormData.append('api_key', apiKey);
      uploadFormData.append('folder', 'metrowayz-events');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadFormData,
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

      console.log('📸 Cloudinary upload response:', data);

      const imageData = {
        url: data.secure_url,
        publicId: data.public_id,
      };

      console.log('📸 Setting image data:', imageData);

      setFormData(prev => ({
        ...prev,
        image: imageData
      }));

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.eventDate || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    const eventData = {
      ...formData,
      ticketPrice: parseFloat(formData.ticketPrice) || 0,
      capacity: parseInt(formData.capacity) || 0,
    };

    console.log('🎯 Submitting event data:', eventData);
    console.log('🎯 Image data being sent:', eventData.image);

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent._id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
            <p className="text-gray-500 mt-1">Create and manage platform events</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-gray-900">{(eventsData as any)?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-blue-600">
              {(eventsData as any)?.filter((e: any) => e.status === 'active' || e.status === 'upcoming').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Featured</p>
            <p className="text-2xl font-bold text-purple-600">
              {(eventsData as any)?.filter((e: any) => e.featured).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Capacity</p>
            <p className="text-2xl font-bold text-green-600">
              {(eventsData as any)?.reduce((acc: number, e: any) => acc + (e.capacity || 0), 0) || 0}
            </p>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : (eventsData as any)?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(eventsData as any).map((event: any) => (
              <div key={event._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200">
                  {(event.image || event.images?.[0]?.url) ? (
                    <img
                      src={event.image || event.images[0].url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('📸 Super admin - Image failed to load:', event.image || event.images[0].url);
                        console.error('📸 Super admin - Event data:', event);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {event.featured && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {/* Event Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{event.title}</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {event.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      {format(new Date(event.eventDate), 'MMM dd, yyyy')} at {event.eventTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign size={16} className="mr-2" />
                      ₦{event.ticketPrice?.toLocaleString()} per ticket
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users size={16} className="mr-2" />
                      {event.availableTickets || event.capacity} / {event.capacity} available
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(event)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id, event.title)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">Create your first platform event</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Create Event
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full my-8">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location (City/Area) *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Lagos, Nigeria"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Eko Convention Center"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Event Location on Map
                    </label>
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={(lat, lng) => {
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Price (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {formData.image ? (
                        <div className="relative">
                          <img src={formData.image.url} alt="Event" className="w-full h-48 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="event-image"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="event-image"
                            className="cursor-pointer text-purple-600 hover:text-purple-700"
                          >
                            {uploading ? 'Uploading...' : 'Click to upload image'}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Featured Event</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || uploading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingEvent
                      ? 'Update Event'
                      : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default EventsManagement;
