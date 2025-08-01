"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import Head from "next/head";
import Header from "@/src/components/Header";
import {
  UserIcon,
  MapPinIcon,
  // PhoneIcon,
  HeartIcon,
  TagIcon,
  // CalendarDaysIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  UserIcon as UserIconSolid,
  MapPinIcon as MapPinIconSolid,
  PhoneIcon as PhoneIconSolid,
} from "@heroicons/react/24/solid";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  contactType: string;
  serviceType: string;
  contactDate: string;
  gender: string;
  district: string;
  feedback?: Feedback[];
}

interface Feedback {
  id: string;
  feedback: string;
  initiator: string;
  date_created: string;
}

export default function ViewDetailsPage() {
  const { id } = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [feedbackForm, setFeedbackForm] = useState({
    feedback: "",
    date: today,
    counselor: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch the contact details (including feedback) from the API
  useEffect(() => {
    if (!id) return;
    async function fetchContact() {
      try {
        const res = await fetch(`/api/feedbacks/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch contact details");
        }
        const data = await res.json();
        setContact(data);
        if (data.feedback) {
          setFeedbacks(data.feedback);
        }
      } catch (error) {
        console.error("Error fetching contact details:", error);
        toast.error("Failed to load contact details");
      } finally {
        setPageLoading(false);
      }
    }
    fetchContact();
  }, [id]);

  const handleFeedbackChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFeedbackForm({ ...feedbackForm, [e.target.name]: e.target.value });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) {
      console.error("Contact not loaded");
      return;
    }
    setLoading(true);
    try {
      const feedbackData = {
        contact_id: contact.id,
        feedback: feedbackForm.feedback,
        initiator: feedbackForm.counselor,
        date_created: feedbackForm.date,
      };

      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });
      if (!res.ok) {
        throw new Error("Failed to add feedback");
      }
      const newFeedback = await res.json();
      setFeedbacks((prev) => [...prev, newFeedback]);
      if (contact) {
        setContact({
          ...contact,
          feedback: [...(contact.feedback || []), newFeedback],
        });
      }
      setFeedbackForm({ feedback: "", date: today, counselor: "" });
      toast.success("✅ Feedback added successfully!");
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("❌ Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "first timer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "new convert":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender.toLowerCase() === "male"
      ? "👨"
      : gender.toLowerCase() === "female"
      ? "👩"
      : "👤";
  };

  if (pageLoading) {
    return (
      <>
        <Head>
          <title>Loading Contact Details - Faith Connect</title>
        </Head>
        <Header appName="View Details" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <UserIcon className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Loading Contact Details
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we fetch the information...
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          {contact
            ? `${contact.firstName} ${contact.lastName} - Contact Details`
            : "Contact Details"}{" "}
          - Faith Connect
        </title>
        <meta
          name="description"
          content="View detailed information about contact including feedback history and add new feedback."
        />
        <link rel="canonical" href={`/dashboard/detail/${id}`} />
      </Head>

      <Header appName="Contact Details" />
      <Toaster position="top-right" />

      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-all duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {contact ? (
            <div className="space-y-6 lg:space-y-8">
              {/* Header Section with Contact Summary */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 sm:px-8 py-6 sm:py-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3">
                        <UserIconSolid className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                          {contact.firstName} {contact.lastName}
                        </h1>
                        <p className="text-indigo-100 text-sm sm:text-base mt-1">
                          Added on{" "}
                          {moment(contact.contactDate).format("MMMM DD, YYYY")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getContactTypeColor(
                          contact.contactType
                        )} backdrop-blur-sm`}
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {contact.contactType}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                        <span className="mr-1">
                          {getGenderIcon(contact.gender)}
                        </span>
                        {contact.gender}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Contact Details - Takes 2 columns on xl screens */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-indigo-100 rounded-lg p-2">
                        <InformationCircleIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Contact Information
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Contact Info Cards */}
                      <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 rounded-lg p-2 mt-1">
                            <PhoneIconSolid className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Phone Number
                            </p>
                            <p className="text-lg font-semibold text-gray-900 truncate">
                              {contact.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="bg-green-100 rounded-lg p-2 mt-1">
                            <MapPinIconSolid className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Address
                            </p>
                            <p className="text-lg font-semibold text-gray-900 break-words">
                              {contact.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="bg-purple-100 rounded-lg p-2 mt-1">
                            <TagIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Service Type
                            </p>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {contact.serviceType}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="bg-indigo-100 rounded-lg p-2 mt-1">
                            <MapPinIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              District
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {contact.district}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prayer Point Section */}
                    {contact.prayerPoint && (
                      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="bg-amber-100 rounded-lg p-2 mt-1">
                            <HeartIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800 mb-2">
                              Prayer Point
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {contact.prayerPoint}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback Form - Takes 1 column on xl screens */}
                <div className="xl:col-span-1">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 sticky top-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-green-100 rounded-lg p-2">
                        <PlusIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Add Feedback
                      </h2>
                    </div>

                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="feedback"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Feedback Message
                        </label>
                        <textarea
                          id="feedback"
                          name="feedback"
                          value={feedbackForm.feedback}
                          onChange={handleFeedbackChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 resize-none"
                          required
                          placeholder="Enter your feedback here..."
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="counselor"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Counselor Name
                        </label>
                        <input
                          type="text"
                          id="counselor"
                          name="counselor"
                          value={feedbackForm.counselor}
                          onChange={handleFeedbackChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400 transition-all duration-200"
                          required
                          placeholder="Enter counselor name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={feedbackForm.date}
                          onChange={handleFeedbackChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400 transition-all duration-200"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin inline-block w-5 h-5 border-3 border-white border-t-transparent rounded-full mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Feedback History */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                          Feedback History
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {feedbacks.length}{" "}
                          {feedbacks.length === 1 ? "feedback" : "feedbacks"}{" "}
                          recorded
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {feedbacks.length > 0 ? (
                    <div className="space-y-4">
                      {feedbacks.map((fb, index) => (
                        <div
                          key={fb.id}
                          className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                            <div className="flex-1">
                              <p className="text-gray-900 leading-relaxed mb-3">
                                {fb.feedback}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <UserGroupIcon className="w-4 h-4" />
                                  <span className="font-medium">
                                    Counselor:
                                  </span>
                                  <span>{fb.initiator}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>
                                    {moment(fb.date_created).format(
                                      "MMM DD, YYYY"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                #{feedbacks.length - index}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No feedback yet
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Be the first to add feedback for this contact. Your
                        insights help us provide better support.
                      </p>
                      <button
                        onClick={() =>
                          document.getElementById("feedback")?.focus()
                        }
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add First Feedback
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <div className="text-red-100 text-6xl mb-4">😔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Contact Not Found
                </h3>
                <p className="text-gray-500">
                  The contact you&apos;re looking for doesn&apos;t exist or has been
                  removed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
