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
}

export default function EditContact() {
  const router = useRouter();
  const { id } = useParams(); // Extract the contact ID from the URL
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    prayerPoint: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch contact");
        }
        const data = await res.json();
        // Populate the form with the fetched contact data
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          phone: data.phone,
          prayerPoint: data.prayerPoint,
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
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUpdating(true);
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

  if (loading) return   <header className="w-full bg-white border-b">
  <div className="flex items-center justify-center h-16">
    <div className="flex items-center space-x-2">
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
      <span className="text-gray-600">Loading user...</span>
    </div>
  </div>
</header>;

  return (
    <>
      <Head>
        <title>Edit Contact - Faith Connect</title>
        <meta
          name="description"
          content="Edit your contact details in Faith Connect."
        />
        <link rel="canonical" href={`/edit/${id}`} />
      </Head>

      {/* Toast Container */}
      <Toaster position="top-right" />

      <Header
        appName="Edit Contact"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center px-4">
        <div className="bg-white shadow-2xl rounded-xl px-8 py-10 w-full max-w-md">
          <h2 className="text-center text-3xl font-bold text-gray-800 mb-8">
            Edit Contact
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
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
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
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
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
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
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-md text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition duration-200 disabled:opacity-50"
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
    </>
  );
}
