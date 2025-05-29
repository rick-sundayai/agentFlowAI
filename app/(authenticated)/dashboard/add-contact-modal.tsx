"use client";

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { z } from 'zod';

// Define the contact schema using Zod for validation
const contactSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
  phone: z.string().optional().nullable(),
  property_address: z.string().optional().nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

export default function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    property_address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setErrors({});

    try {
      // Validate the form data
      const result = contactSchema.safeParse(formData);
      
      if (!result.success) {
        // Handle validation errors
        const formattedErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          if (issue.path[0]) {
            formattedErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(formattedErrors);
        setIsSubmitting(false);
        return;
      }

      // Submit to Supabase
      const supabase = createClient();
      
      // First get the current user to set the user_id field
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubmitError('You must be logged in to add contacts');
        setIsSubmitting(false);
        return;
      }
      
      const { error } = await supabase
        .from('contacts')
        .insert([{
          ...result.data,
          // Set the user_id to the current user's ID
          user_id: user.id,
          // Convert empty strings to null for optional fields
          email: result.data.email || null,
          phone: result.data.phone || null,
          property_address: result.data.property_address || null,
        }]);

      if (error) {
        console.error('Error adding contact:', error);
        // Provide a more detailed error message
        let errorMessage = 'Failed to add contact';
        
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        if (error.details) {
          errorMessage += ` (${error.details})`;
        }
        
        if (error.hint) {
          errorMessage += `. Hint: ${error.hint}`;
        }
        
        if (error.code) {
          errorMessage += `. Code: ${error.code}`;
        }
        
        setSubmitError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Success - reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        property_address: '',
      });
      setIsSubmitting(false);
      onContactAdded();
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Contact
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
              </div>

              {/* Property Address Field */}
              <div>
                <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Address
                </label>
                <textarea
                  id="property_address"
                  name="property_address"
                  value={formData.property_address || ''}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border ${errors.property_address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="123 Main St, City, State, ZIP"
                />
                {errors.property_address && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.property_address}</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
