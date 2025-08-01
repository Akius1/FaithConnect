"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import Header from "@/src/components/Header";
import toast, { Toaster } from "react-hot-toast";

interface FormData {
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
}

export default function EditContact() {
  const router = useRouter();
  const { id } = useParams(); // Extract the contact ID from the URL
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    prayerPoint: "",
    contactType: "",
    serviceType: "",
    contactDate: today,
    gender: "",
    district: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch contact");
        }
        const data = await res.json();
        // Populate the form with the fetched contact data.
        // Ensure contactDate is formatted as YYYY-MM-DD.
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          phone: data.phone,
          prayerPoint: data.prayerPoint,
          contactType: data.contactType,
          serviceType: data.serviceType,
          gender: data.gender || "",
          district: data.district || "",
          contactDate: data.contactDate
            ? data.contactDate.split("T")[0]
            : today,
        });
      } catch (error) {
        console.error("Error fetching contact:", error);
        toast.error("Failed to load contact details");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchContact();
    }
  }, [id, today]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Restrict phone input to digits only
  const handlePhoneKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const charCode = e.charCode;
    if (charCode < 48 || charCode > 57) {
      e.preventDefault();
    }
  };

  // Validates Nigerian phone numbers (e.g., 08012345678)
  const validateNigeriaPhoneNumber = (phone: string) => {
    const regex = /^0[7-9]\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    if (!validateNigeriaPhoneNumber(formData.phone)) {
      setPhoneError(
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      );
      setUpdating(false);
      return;
    } else {
      setPhoneError("");
    }

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        throw new Error("Update failed");
      }
      toast.success("Contact updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setUpdating(false);
    }
  };

  // Disable submit button if phone number or date is not filled
  const isDisabled = !formData.phone.trim() || !formData.contactDate.trim();

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <Header appName="Edit Contact" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-xl shadow-lg">
            <svg
              className="animate-spin h-6 w-6 text-indigo-600"
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
            <span className="text-gray-600 font-medium">
              Loading contact...
            </span>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <Head>
        <title>Edit Contact - Faith Connect</title>
        <meta
          name="description"
          content="Edit your contact details in Faith Connect. Update your name, address, phone number, prayer point, contact type, service type, gender, district and date."
        />
        <link rel="canonical" href={`/edit/${id}`} />
      </Head>

      {/* Toast Container */}
      <Toaster position="top-right" />

      <Header appName="Edit Contact" />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-2xl rounded-xl px-6 sm:px-8 py-8 sm:py-10 w-full max-w-md">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
              Edit Contact
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyPress={handlePhoneKeyPress}
                  inputMode="numeric"
                  pattern="^0[7-9]\d{9}$"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>

              {/* Two Select Fields in a Row for Contact Type and Service Type */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="contactType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contact Type
                  </label>
                  <select
                    name="contactType"
                    id="contactType"
                    value={formData.contactType}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select Type</option>
                    <option value="first timer">First Timer</option>
                    <option value="new convert">New Convert</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="serviceType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Service Type
                  </label>
                  <select
                    name="serviceType"
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select Service</option>
                    <option value="crusade">Crusade</option>
                    <option value="apostolic inversion">
                      Apostolic Inversion
                    </option>
                    <option value="sunday service">Sunday Service</option>
                    <option value="mid week service">Mid Week Service</option>
                    <option value="www night">WWW Night</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>

              {/* Two Select Fields in a Row for Gender and District */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="district"
                    className="block text-sm font-medium text-gray-700"
                  >
                    District
                  </label>
                  <select
                    name="district"
                    id="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select District</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={`District ${i + 1}`}>
                        District {i + 1}
                      </option>
                    ))}
                    <option value="Out Station">Out Station</option>
                  </select>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label
                  htmlFor="contactDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date *
                </label>
                <input
                  type="date"
                  name="contactDate"
                  id="contactDate"
                  value={formData.contactDate}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Prayer Point */}
              <div>
                <label
                  htmlFor="prayerPoint"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prayer Point
                </label>
                <textarea
                  name="prayerPoint"
                  id="prayerPoint"
                  value={formData.prayerPoint}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={updating || isDisabled}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base sm:text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {updating ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-4 border-t-transparent border-white rounded-full mr-2"></span>
                    Updating...
                  </>
                ) : (
                  "Update Contact"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
