"use client";
import Header from "@/src/components/Header";
import { SERVICE_TYPE_FORM_OPTIONS } from "@/src/lib/constants";
import { useState, FormEvent, useEffect } from "react";
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
  gender: string;
  district: string;
}

// District options matching the database
const DISTRICTS = [
  "District 1",
  "District 2A",
  "District 2B",
  "District 3A",
  "District 3B",
  "District 4",
  "District 5",
  "District 7",
  "District 8",
  "District 9",
  "District 10",
  "District 11",
  "Out Station", // For areas outside Lagos State
];

export default function AddContact() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [suggestedDistrict, setSuggestedDistrict] = useState<string | null>(
    null
  );
  const [isDistrictAutoDetected, setIsDistrictAutoDetected] = useState(false);

  // Auto-detect district from address
  const detectDistrictFromAddress = (address: string): string | null => {
    if (!address || address.trim().length < 3) return null;

    const addressUpper = address.toUpperCase();

    // District 1: JIBOWU, AKOKA, YABA, SABO, EBUTE-METTA, OYINGBO, FADEYI, MUSHIN
    if (
      /(JIBOWU|AKOKA|YABA|SABO|EBUTE.?METTA|OYINGBO|FADEYI|MUSHIN)/.test(
        addressUpper
      )
    ) {
      return "District 1";
    }

    // District 2A: SOMOLU, ONIPANU, PALM GROVE, ILUPEJU, OBANIKORO
    if (
      /(SOMOLU|ONIPANU|PALM.?GROVE|ILUPEJU|OBANIKORO|PALMGROVE|SHOMOLU)/.test(
        addressUpper
      )
    ) {
      return "District 2A";
    }

    // District 2B: PEDRO
    if (/(PEDRO|BARIGA.?ROAD)/.test(addressUpper)) {
      return "District 2B";
    }

    // District 3A: OWORONSHOKI, IFAKO, GBAGADA, ANTHONY
    if (
      /(OWORONSHOKI|IFAKO|GBAGADA|ANTHONY|OWORO|OWORONSOKI)/.test(addressUpper)
    ) {
      return "District 3A";
    }

    // District 3B: LADI-LAK, BARIGA
    if (/(LADI.?LAK|BARIGA|ILAJE|NEW.?GARAGE|LADILAK)/.test(addressUpper)) {
      return "District 3B";
    }

    // District 4: SURULERE, COSTAIN, IGANMU, IPORIN, STADIUM, MASHA, ADELABU
    if (
      /(SURULERE|COSTAIN|IGANMU|IPORIN|STADIUM|MASHA|ADELABU|KILO|AGUDA)/.test(
        addressUpper
      )
    ) {
      return "District 4";
    }

    // District 5: ITIRE, OJU-ELEGBA, LAWANSON
    if (/(ITIRE|OJU.?ELEGBA|LAWANSON|OJUELEGBA|ISHAGA)/.test(addressUpper)) {
      return "District 5";
    }

    // District 7: OKOTA, AJAO ESTATE, OSHODI, etc.
    if (
      /(OKOTA|AJAO.?ESTATE|ASWANI|OSHODI|MAFOLUKU|CEMENT|MARYLAND|CANTOMENT|CANTONMENT|NAF.?BASE|IKEJA|SHOGUNLE)/.test(
        addressUpper
      )
    ) {
      return "District 7";
    }

    // District 8: LAGOS ISLAND
    if (/(VICTORIA.?ISLAND|BONNY.?CAMP|LAGOS.?ISLAND)/.test(addressUpper)) {
      return "District 8";
    }

    // District 9: ABULE-EGBA, IYANA IPAJA, IJU-ISHAGA, IDIMU
    if (
      /(ABULE.?EGBA|IYANA.?IPAJA|IJU.?ISHAGA|IDIMU|ABORU|ALIMOSHO|BALOGUN)/.test(
        addressUpper
      )
    ) {
      return "District 9";
    }

    // District 10: ALLEN, OGBA, MAGODO, BERGER, IBAFO, MOWE, AGBADO
    if (
      /(ALLEN|OGBA|MAGODO|BERGER|IBAFO|MOWE|AGBADO|OJODU|ISHERI|OPIC|AREPO)/.test(
        addressUpper
      )
    ) {
      return "District 10";
    }

    // District 11: KETU, ALAKPERE, OJOTA, OGUDU, MILE 12, IKORODU
    if (
      /(KETU|ALAKPERE|OJOTA|OGUDU|MILE.?12|IKORODU|OWODE|ONIRIN|AGBEDE|ELEEBIJU|IKOSI)/.test(
        addressUpper
      )
    ) {
      return "District 11";
    }

    return null;
  };

  // Watch address changes and auto-detect district
  useEffect(() => {
    if (formData.address) {
      const detected = detectDistrictFromAddress(formData.address);

      if (detected) {
        setSuggestedDistrict(detected);

        // Only auto-fill if user hasn't manually selected a district
        if (!formData.district || isDistrictAutoDetected) {
          setFormData((prev) => ({ ...prev, district: detected }));
          setIsDistrictAutoDetected(true);
        }
      } else {
        setSuggestedDistrict(null);
      }
    } else {
      setSuggestedDistrict(null);
    }
  }, [formData.address]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // If user manually changes district, mark it as manual selection
    if (name === "district") {
      setIsDistrictAutoDetected(false);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const charCode = e.charCode;
    if (charCode < 48 || charCode > 57) {
      e.preventDefault();
    }
  };

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
        const errorData = await res.json();
        throw new Error(errorData.error || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting contact:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add contact"
      );
      setLoading(false);
    }
  };

  const isDisabled = !formData.phone.trim() || !formData.contactDate.trim();

  return (
    <>
      <Head>
        <title>Add Contact - Faith Connect</title>
        <meta
          name="description"
          content="Add a new contact to Faith Connect with auto-district detection."
        />
        <link rel="canonical" href="/add-contact" />
      </Head>

      <Toaster position="top-right" />
      <Header appName="Add Contact" />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-2xl rounded-xl px-5 sm:px-8 py-8 sm:py-10 w-full max-w-xl">
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

              {/* Address with Auto-Detection Badge */}
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
                  placeholder="Enter address to auto-detect district"
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {suggestedDistrict && isDistrictAutoDetected && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    District auto-detected: {suggestedDistrict}
                  </p>
                )}
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
                  placeholder="08012345678"
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>

              {/* Contact Type and Service Type */}
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
                    {SERVICE_TYPE_FORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender and District */}
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
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="district"
                    className="block text-sm font-medium text-gray-700"
                  >
                    District{" "}
                    {isDistrictAutoDetected && (
                      <span className="text-xs text-green-600">(Auto)</span>
                    )}
                  </label>
                  <select
                    name="district"
                    id="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
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
                  placeholder="Enter prayer requests..."
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || isDisabled}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-4 border-t-transparent border-white rounded-full mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Contact"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
