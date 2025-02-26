"use client";

import { useEffect, useState, ChangeEvent, useMemo } from "react";
import Head from "next/head";
import Header from "@/src/components/Header";
import { useTable, usePagination } from "react-table";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Column } from "react-table";
import DownloadPhones from "../DownloadPhoneNumber";

interface Entry {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  createdAt: Date;
}

interface RawEntry {
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

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) {
          throw new Error("Failed to fetch contacts");
        }
        const data = await res.json();
        const parsedData: Entry[] = (data as RawEntry[]).map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setContacts(parsedData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    }
    fetchContacts();
  }, []);

  useEffect(() => {
    const now = new Date();
    const lowerSearch = searchTerm.toLowerCase();
  
    const filtered = contacts.filter((entry) => {
      // Check if any string field contains the search term
      const matchesSearch = Object.values(entry).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerSearch);
        }
        return false;
      });
  
      let matchesFilter = true;
      const entryDate = entry.createdAt;
  
      if (filterPeriod === "day") {
        // Filter for entries created today
        matchesFilter =
          entryDate.getFullYear() === now.getFullYear() &&
          entryDate.getMonth() === now.getMonth() &&
          entryDate.getDate() === now.getDate();
      } else if (filterPeriod === "week") {
        // Filter for entries created in the current week
        // Assuming week starts on Sunday and ends on Saturday
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
        // Filter for entries in the current month
        matchesFilter =
          entryDate.getFullYear() === now.getFullYear() &&
          entryDate.getMonth() === now.getMonth();
      } else if (filterPeriod === "year") {
        // Filter for entries in the current year
        matchesFilter = entryDate.getFullYear() === now.getFullYear();
      }
  
      return matchesSearch && matchesFilter;
    });
  
    setFilteredData(filtered);
  }, [searchTerm, filterPeriod, contacts]);
  

  const data = useMemo(() => filteredData, [filteredData]);
  const columns: readonly Column<Entry>[] = useMemo(
    () => [
      { Header: "First Name", accessor: "firstName" as const },
      { Header: "Last Name", accessor: "lastName" as const },
      { Header: "Address", accessor: "address" as const },
      { Header: "Phone Number", accessor: "phone" as const },
      { Header: "Prayer Point", accessor: "prayerPoint" as const },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state: { pageIndex },
    nextPage,
    previousPage,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 5 },
    },
    usePagination
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterPeriod(e.target.value);
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

      <Header
        appName="Dashboard"
        username="John Doe"
        profileImageUrl="/profile.jpg"
        onLogout={() => console.log("Logout")}
      />

      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Top Section */}
        <section className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative w-full md:w-1/3">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
              height={20}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="w-full md:w-1/5">
            <select
              value={filterPeriod}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="all">All</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="w-full md:w-1/4 ml-auto">
            <button
              onClick={() => console.log("Add Contact")}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 transition transform hover:scale-105"
            >
              Add Contact
            </button>
          </div>
        </section>

        {/* Download Contact Button */}
        <div className="flex justify-end mb-4">
         <DownloadPhones />
        </div>

        {/* Table Section */}
        <section className="overflow-x-auto bg-white shadow-lg rounded-xl">
          <table {...getTableProps()} className="min-w-full table-auto">
            <thead className="bg-indigo-100">
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                      key={column.id}
                    >
                      {column.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={row.id}
                    className="border-t hover:bg-indigo-50 transition-colors"
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-6 py-4 text-sm text-gray-600"
                        key={cell.column.id}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span className="text-gray-700 font-medium">
              Page {pageIndex + 1} of {pageOptions.length}
            </span>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
