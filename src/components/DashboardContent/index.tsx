"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Header from "@/src/components/Header";
import DownloadPhones from "@/src/components/DownloadPhoneNumber";
import toast, { Toaster } from "react-hot-toast";
import SearchFilterBar from "./SearchFilterBar";
import ContactsTable from "./ContactsTable";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export interface Entry {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  createdAt: Date;
}

interface RawEntry {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  createdAt: string;
}

export default function Dashboard() {
  const [contacts, setContacts] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filteredData, setFilteredData] = useState<Entry[]>([]);
  const [selectedContactForDeletion, setSelectedContactForDeletion] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch contacts from API
  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        const parsedData: Entry[] = (data as RawEntry[]).map((item) => ({
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          address: item.address,
          phone: item.phone,
          prayerPoint: item.prayerPoint,
          createdAt: new Date(item.createdAt),
        }));
        setContacts(parsedData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    }
    fetchContacts();
  }, []);

  // Filter contacts based on search term and period
  useEffect(() => {
    const now = new Date();
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = contacts.filter((entry) => {
      // Check if any string field contains the search term.
      const matchesSearch = Object.values(entry).some((value) =>
        typeof value === "string" ? value.toLowerCase().includes(lowerSearch) : false
      );
      let matchesFilter = true;
      const entryDate = entry.createdAt;
      if (filterPeriod === "day") {
        matchesFilter =
          entryDate.getFullYear() === now.getFullYear() &&
          entryDate.getMonth() === now.getMonth() &&
          entryDate.getDate() === now.getDate();
      } else if (filterPeriod === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        matchesFilter =
          entryDate.getTime() >= startOfWeek.getTime() &&
          entryDate.getTime() <= endOfWeek.getTime();
      } else if (filterPeriod === "month") {
        matchesFilter =
          entryDate.getFullYear() === now.getFullYear() &&
          entryDate.getMonth() === now.getMonth();
      } else if (filterPeriod === "year") {
        matchesFilter = entryDate.getFullYear() === now.getFullYear();
      }
      return matchesSearch && matchesFilter;
    });
    setFilteredData(filtered);
  }, [searchTerm, filterPeriod, contacts]);
  

  // Delete contact API call with loader and toast notifications
  const handleDeleteContact = async (contact: Entry) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      toast.success("Contact deleted successfully!");
      setSelectedContactForDeletion(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete contact.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - Faith Connect</title>
        <meta
          name="description"
          content="Access your dashboard on Faith Connect to manage contacts, send SMS, and view statistics."
        />
        <meta property="og:title" content="Dashboard - Faith Connect" />
        <meta
          property="og:description"
          content="Access your dashboard on Faith Connect to manage contacts, send SMS, and view statistics."
        />
        <meta property="og:url" content="https://www.yourdomain.com/dashboard" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.yourdomain.com/dashboard" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Dashboard - Faith Connect",
              "description":
                "Access your dashboard on Faith Connect to manage contacts, send SMS, and view statistics.",
              "url": "https://www.yourdomain.com/dashboard",
            }),
          }}
        />
      </Head>

      {/* Toast container */}
      <Toaster position="top-right" />

      <Header
        appName="Dashboard"
      />

      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <SearchFilterBar
          searchTerm={searchTerm}
          filterPeriod={filterPeriod}
          setSearchTerm={setSearchTerm}
          setFilterPeriod={setFilterPeriod}
        />

        <div className="flex justify-end mb-4">
          <DownloadPhones />
        </div>

        <ContactsTable
          data={filteredData}
          setSelectedContactForDeletion={setSelectedContactForDeletion}
        />
      </main>

      <DeleteConfirmationModal
        contact={selectedContactForDeletion}
        onCancel={() => setSelectedContactForDeletion(null)}
        onConfirm={() => selectedContactForDeletion && handleDeleteContact(selectedContactForDeletion)}
        isDeleting={isDeleting}
      />
    </>
  );
}
