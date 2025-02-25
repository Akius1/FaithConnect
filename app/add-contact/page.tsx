"use client"
import Header from "@/src/components/Header";
// pages/index.tsx

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface FormData {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    prayerPoint: string;
}

export default function Home() {

      const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
        prayerPoint: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            // Redirect to dashboard or clear the form as needed
            console.log(res)
              router.push("/dashboard")
        }
    };

    return (
        <div className="w-full">
            <Header appName="Add Contact"
                username="John Doe"
                profileImageUrl="/profile.jpg" // Use a default or actual profile image
                onLogout={() => console.log()} />
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
                    <h2 className="text-2xl font-bold mb-6 text-center">Add Contact</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="firstName" className="block text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-gray-700">Address</label>
                            <input
                                type="text"
                                name="address"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="prayerPoint" className="block text-gray-700">Prayer Point</label>
                            <textarea
                                name="prayerPoint"
                                id="prayerPoint"
                                value={formData.prayerPoint}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                rows={4}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                        >
                            Submit Request
                        </button>
                    </form>
                </div>
            </div>
        </div>

    );
}
