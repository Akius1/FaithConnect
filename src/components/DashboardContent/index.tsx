"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Header from "@/src/components/Header";
import DownloadPhones from "@/src/components/DownloadPhoneNumber";
import toast, { Toaster } from "react-hot-toast";
import SearchFilterBar from "./SearchFilterBar";
import ContactsTable from "./ContactsTable";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import CustomDateFilterModal from "./CustomDateFilterModal";

export interface Entry {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  contactType: string;
  serviceType: string;
  gender: string;
  district: string;
  contactDate: Date;
  createdAt: Date;
}

interface RawEntry {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  contactType: string;
  serviceType: string;
  gender: string;
  district: string;
  contactDate: string;
  createdAt: string;
}

export default function Dashboard() {
  const [contacts, setContacts] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("filterByPeriod");
  const [contactTypeFilter, setContactTypeFilter] = useState(
    "filterByContactType"
  );
  const [filteredData, setFilteredData] = useState<Entry[]>([]);
  const [selectedContactForDeletion, setSelectedContactForDeletion] =
    useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom date states for custom filtering; default to today's date
  const today = new Date().toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  const [showCustomModal, setShowCustomModal] = useState(false);

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
          gender: item.gender,
          district: item.district,
          contactType: item.contactType,
          serviceType: item.serviceType,
          contactDate: new Date(item.contactDate),
          createdAt: new Date(item.createdAt),
        }));
        setContacts(parsedData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    }
    fetchContacts();
  }, []);

  // Filtering contacts based on search term, period filter, custom date range, and contact type
  useEffect(() => {
    const now = new Date();
    const lowerSearch = searchTerm.toLowerCase();

    const effectivePeriod =
      periodFilter === "filterByPeriod" ? "all" : periodFilter;
    const effectiveContactType =
      contactTypeFilter === "filterByContactType" ? "all" : contactTypeFilter;

    const filtered = contacts.filter((entry) => {
      const matchesSearch = Object.values(entry).some((value) =>
        typeof value === "string"
          ? value.toLowerCase().includes(lowerSearch)
          : false
      );
      let matchesFilter = true;
      if (effectivePeriod !== "all") {
        if (["day", "week", "month", "year"].includes(effectivePeriod)) {
          if (effectivePeriod === "day") {
            matchesFilter =
              entry.createdAt.getFullYear() === now.getFullYear() &&
              entry.createdAt.getMonth() === now.getMonth() &&
              entry.createdAt.getDate() === now.getDate();
          } else if (effectivePeriod === "week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            matchesFilter =
              entry.createdAt.getTime() >= startOfWeek.getTime() &&
              entry.createdAt.getTime() <= endOfWeek.getTime();
          } else if (effectivePeriod === "month") {
            matchesFilter =
              entry.createdAt.getFullYear() === now.getFullYear() &&
              entry.createdAt.getMonth() === now.getMonth();
          } else if (effectivePeriod === "year") {
            matchesFilter = entry.createdAt.getFullYear() === now.getFullYear();
          }
        } else if (effectivePeriod === "custom") {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          matchesFilter =
            entry.contactDate >= start && entry.contactDate <= end;
        }
      }
      if (effectiveContactType !== "all") {
        matchesFilter =
          matchesFilter &&
          entry.contactType?.toLowerCase() ===
            effectiveContactType?.toLowerCase();
      }
      return matchesSearch && matchesFilter;
    });

    setFilteredData(filtered);
  }, [
    searchTerm,
    periodFilter,
    contactTypeFilter,
    customStartDate,
    customEndDate,
    contacts,
  ]);

  // Delete contact API call with loader and toast notifications
  const handleDeleteContact = async (contact: Entry) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      });
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
        <meta
          property="og:url"
          content="https://www.yourdomain.com/dashboard"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.yourdomain.com/dashboard" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Dashboard - Faith Connect",
              description:
                "Access your dashboard on Faith Connect to manage contacts, send SMS, and view statistics.",
              url: "https://www.yourdomain.com/dashboard",
            }),
          }}
        />
      </Head>

      {/* Toast container */}
      <Toaster position="top-right" />

      <Header appName="Dashboard" />

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 px-4 sm:px-8 w-full overflow-x-hidden">
        <SearchFilterBar
          searchTerm={searchTerm}
          periodFilter={periodFilter}
          contactTypeFilter={contactTypeFilter}
          setSearchTerm={setSearchTerm}
          setPeriodFilter={setPeriodFilter}
          setContactTypeFilter={setContactTypeFilter}
          onOpenCustomModal={() => setShowCustomModal(true)}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 w-full">
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
        onConfirm={() =>
          selectedContactForDeletion &&
          handleDeleteContact(selectedContactForDeletion)
        }
        isDeleting={isDeleting}
      />

      {showCustomModal && (
        <CustomDateFilterModal
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
          onApply={(start, end) => {
            setCustomStartDate(start);
            setCustomEndDate(end);
            setPeriodFilter("custom");
            setShowCustomModal(false);
          }}
          onCancel={() => setShowCustomModal(false)}
        />
      )}
    </>
  );
}
