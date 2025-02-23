"use client";

import { useEffect, useState, ChangeEvent, useMemo } from "react";
import Header from "@/src/components/Header";
import { useTable, usePagination } from "react-table";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Column } from "react-table";

interface Entry {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  createdAt: Date;
}

// Generate dummy data with a random "createdAt" date in the last year.
const generateDummyData = (): Entry[] => {
  const data: Entry[] = [];
  for (let i = 1; i <= 25; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 365);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomDaysAgo);
    data.push({
      firstName: `John${i}`,
      lastName: `Doe${i}`,
      address: `${i} Main Street`,
      phone: `123-456-78${i.toString().padStart(2, "0")}`,
      prayerPoint: "For peace and progress",
      createdAt,
    });
  }
  return data;
};

export default function Dashboard() {
  // Memoize dummy data so it doesn't re-generate on each render.
  const dummyData = useMemo(() => generateDummyData(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("day");
  const [filteredData, setFilteredData] = useState<Entry[]>(dummyData);

  // Update filtered data based on search term and selected filter period.
  useEffect(() => {
    const now = new Date();
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = dummyData.filter((entry) => {
      // Check if any string field contains the search term.
      const matchesSearch = Object.values(entry).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerSearch);
        }
        return false;
      });

      // Determine if the entry falls within the selected filter period.
      let matchesFilter = true;
      const diffTime = Math.abs(now.getTime() - entry.createdAt.getTime());
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (filterPeriod === "day") {
        // Only include today's entries.
        matchesFilter = entry.createdAt.toDateString() === now.toDateString();
      } else if (filterPeriod === "week") {
        matchesFilter = diffDays <= 7;
      } else if (filterPeriod === "month") {
        matchesFilter = diffDays <= 30;
      } else if (filterPeriod === "year") {
        matchesFilter = diffDays <= 365;
      }

      return matchesSearch && matchesFilter;
    });

    setFilteredData(filtered);
  }, [searchTerm, filterPeriod, dummyData]);

  // react-table setup: columns and data.
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
    page, // rows for current page
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
      <Header
        appName="Dashboard"
        username="John Doe"
        profileImageUrl="/profile.jpg"
        onLogout={() => console.log("Logout")}
      />

      <div className="min-h-screen p-8 bg-gray-50">
        {/* Top Section */}
        <div className="flex items-center mb-4">
          {/* Search Input (30% width) */}
          <div className="relative" style={{ width: "30%" }}>
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
              className="pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:font-normal transition"
              style={{ width: "100%" }}
            />
          </div>
          {/* Filter Dropdown (10% width) */}
          <select
            value={filterPeriod}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded p-2 ml-4"
            style={{ width: "10%" }}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          {/* Add Contact Button (20% width, aligned right) */}
          <button
            onClick={() => console.log("Add Contact")}
            className="bg-blue-500 text-white rounded p-2 ml-auto"
            style={{ width: "20%" }}
          >
            Add Contact
          </button>
        </div>

        {/* Download Contact Button (full width container, button aligned right) */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => console.log("Download Contact")}
            className="bg-green-500 text-white rounded p-2"
          >
            Download Contact
          </button>
        </div>

        {/* Table Section with Pagination */}
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table {...getTableProps()} className="min-w-full">
            <thead className="bg-gray-200">
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      className="px-6 py-4 text-left"
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
                    className="border-t hover:bg-gray-50"
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-6 py-4"
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
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page{" "}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>
            </span>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
