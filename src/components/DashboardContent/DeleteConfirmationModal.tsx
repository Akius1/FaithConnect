"use client";

import { Entry } from ".";

interface DeleteConfirmationModalProps {
  contact: Entry | null; // or use your Entry type
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmationModal({
  contact,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteConfirmationModalProps) {
  if (!contact) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
        <p className="mb-6">
          Are you sure you want to delete this contact?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center"
            disabled={isDeleting}
          >
            {isDeleting && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full mr-2"></span>
            )}
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
