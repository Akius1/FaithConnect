"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import Head from "next/head";
import Header from "@/src/components/Header";

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
  feedback?: Feedback[]; // feedback records returned from Supabase
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
  // Prefill the date field with today's date in YYYY-MM-DD format.
  const today = new Date().toISOString().split("T")[0];
  const [feedbackForm, setFeedbackForm] = useState({
    feedback: "",
    date: today,
    counselor: "",
  });
  const [loading, setLoading] = useState(false);

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
        console.log("data: ", data);
        if (data.feedback) {
          setFeedbacks(data.feedback);
        }
      } catch (error) {
        console.error("Error fetching contact details:", error);
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
      // Update local state so the table reflects the new feedback entry
      setFeedbacks((prev) => [...prev, newFeedback]);
      if (contact) {
        setContact({
          ...contact,
          feedback: [...(contact.feedback || []), newFeedback],
        });
      }
      // Clear the form (reset date to today)
      setFeedbackForm({ feedback: "", date: today, counselor: "" });
      toast.success("Feedback added successfully!");
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>View Details Of User - Faith Connect</title>
        <meta
          name="description"
          content="View detail of new convert or first timer user"
        />
        <link rel="canonical" href={`/dashboard/detail/{id}`} />
      </Head>

      <Header appName="View Details" />

      <div className="container mx-auto p-6 space-y-8">
        {/* Toast Container */}
        <Toaster position="top-right" />

        {/* Top Section: Contact Details & Feedback Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel: Contact Details */}
          <div className="bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Contact Details</h2>
            {contact ? (
              <dl className="space-y-4 text-lg">
                <div className="flex justify-between items-center">
                  <dt className="">Name:</dt>
                  <dd className="capitalize font-medium">
                    {contact.firstName} {contact.lastName}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Address:</dt>
                  <dd className="capitalize font-medium">{contact.address}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Phone:</dt>
                  <dd className="capitalize font-medium">{contact.phone}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Prayer Point:</dt>
                  <dd className="capitalize font-medium">
                    {contact.prayerPoint}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Contact Type:</dt>
                  <dd className="capitalize font-medium">
                    {contact.contactType}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Service Type:</dt>
                  <dd className="capitalize font-medium">
                    {contact.serviceType}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Contact Date:</dt>
                  <dd className="capitalize font-medium">
                    {moment(contact.contactDate).format("MMM DD, YYYY")}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">Gender:</dt>
                  <dd className="capitalize font-medium">{contact.gender}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="">District:</dt>
                  <dd className="capitalize font-medium">{contact.district}</dd>
                </div>
              </dl>
            ) : (
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
                  <span className="text-gray-600">Loading Contact detail ...</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Feedback Form */}
          <div className="bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Add Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback" className="block font-medium mb-1">
                  Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  value={feedbackForm.feedback}
                  onChange={handleFeedbackChange}
                  rows={4}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Enter feedback"
                />
              </div>
              <div>
                <label htmlFor="date" className="block font-medium mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={feedbackForm.date}
                  onChange={handleFeedbackChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="counselor" className="block font-medium mb-1">
                  Counselor
                </label>
                <input
                  type="text"
                  id="counselor"
                  name="counselor"
                  value={feedbackForm.counselor}
                  onChange={handleFeedbackChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Enter counselor name"
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
                  "Submit Feedback"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section: Feedback History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Feedback History</h2>
          {feedbacks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border">Feedback</th>
                    <th className="px-4 py-2 border">Counselor</th>
                    <th className="px-4 py-2 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-100">
                      <td className="px-4 py-2 border">{fb.feedback}</td>
                      <td className="px-4 py-2 border">{fb.initiator}</td>
                      <td className="px-4 py-2 border">
                        {moment(fb.date_created).format("MMM DD, YYYY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-xl text-center">
              <p className="text-gray-600 mb-4">No feedback available yet.</p>
              <button
                onClick={() =>
                  document
                    .getElementById("feedback")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Add Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
