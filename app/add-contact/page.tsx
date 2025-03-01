"use client";
import Header from "@/src/components/Header";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
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
}

export default function AddContact() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    prayerPoint: "",
    contactType: "",
    serviceType: "",
    contactDate: today,
  });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    setLoading(true);

    if (!validateNigeriaPhoneNumber(formData.phone)) {
      setPhoneError(
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      );
      setLoading(false);
      return;
    } else {
      setPhoneError("");
    }

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Contact added successfully!");
        router.push("/dashboard");
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting contact:", error);
      toast.error("Failed to add contact");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Contact - Faith Connect</title>
        <meta
          name="description"
          content="Add a new contact to Faith Connect. Provide details like name, address, phone number, prayer point, contact type, service type, and contact date."
        />
        <link rel="canonical" href="/add-contact" />
      </Head>

      {/* Toast Container */}
      <Toaster position="top-right" />

      <Header appName="Add Contact" />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-2xl rounded-xl px-8 py-10 w-full max-w-md">
            <h2 className="text-center text-3xl font-bold text-gray-800 mb-6">
              Add Contact
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
              {/* Two Select Fields in a Row */}
              <div className="flex gap-4">
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
                    <option value="apostolic inversion">Apostolic Inversion</option>
                    <option value="sunday service">Sunday Service</option>
                    <option value="mid week service">Mid Week Service</option>
                    <option value="www night">WWW Night</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>
              {/* Creative Date Input */}
              <div>
                <label
                  htmlFor="contactDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  type="date"
                  name="contactDate"
                  id="contactDate"
                  value={formData.contactDate}
                  onChange={handleChange}
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
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-4 border-t-transparent border-white rounded-full mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
