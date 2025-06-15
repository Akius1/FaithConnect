"use client";

import { useState, useEffect } from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Entry } from ".";

interface DeleteConfirmationModalProps {
  contact: Entry | null;
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
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (contact) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [contact]);

  if (!contact) return null;

  const handleCancel = () => {
    if (isDeleting) return;
    setIsVisible(false);
    setTimeout(onCancel, 150);
  };

  const handleConfirm = () => {
    if (isDeleting) return;
    onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleCancel();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">
                Delete Contact
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
          {!isDeleting && (
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <TrashIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  You are about to permanently delete this contact
                </p>
                <p className="text-xs text-red-600 mt-1">
                  All associated data will be lost forever
                </p>
              </div>
            </div>
          </div>

          {/* Contact Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {contact.firstName} {contact.lastName}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {contact.phone}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {contact.contactType}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                {showDetails ? "Hide" : "Show"} Details
              </button>
            </div>

            {/* Expanded Details */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="text-gray-700 truncate">{contact.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">District:</span>
                    <p className="text-gray-700">{contact.district}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <p className="text-gray-700">{contact.gender}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service Type:</span>
                    <p className="text-gray-700">{contact.serviceType}</p>
                  </div>
                </div>
                {contact.prayerPoint && (
                  <div className="pt-2">
                    <span className="text-gray-500 text-xs">Prayer Point:</span>
                    <p className="text-gray-700 text-xs mt-1 line-clamp-2">
                      {contact.prayerPoint}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirmation Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Are you absolutely sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                <span>Delete Contact</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
