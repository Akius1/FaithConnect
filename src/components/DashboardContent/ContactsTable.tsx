"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTable, usePagination, Column } from "react-table";
import {
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import moment from "moment";
import { Entry } from "."; // Adjust the import path as needed

interface ContactsTableProps {
  data: Entry[];
  setSelectedContactForDeletion: (contact: Entry | null) => void;
}

export default function ContactsTable({
  data,
  setSelectedContactForDeletion,
}: ContactsTableProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sort the data by createdAt descending (most recent on top)
  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [data]);

  const columns: readonly Column<Entry>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "firstName",
        Cell: ({ row }) => (
          <div className="font-medium text-gray-900">
            <div className="text-sm sm:text-base">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-gray-500 sm:hidden">
              {row.original.phone}
            </div>
          </div>
        ),
      },
      {
        Header: "Contact Info",
        accessor: "phone",
        Cell: ({ row }) => (
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">
              {row.original.phone}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {row.original.address}
            </div>
          </div>
        ),
      },
      {
        Header: "Details",
        accessor: "contactType",
        Cell: ({ row }) => (
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900">
              {row.original.contactType}
            </div>
            <div className="text-xs text-gray-500">
              {row.original.serviceType}
            </div>
          </div>
        ),
      },
      {
        Header: "Prayer Point",
        accessor: "prayerPoint",
        Cell: ({ value }) => (
          <div className="hidden lg:block max-w-xs">
            <div className="text-sm text-gray-900 truncate" title={value}>
              {value}
            </div>
          </div>
        ),
      },
      {
        Header: "Gender",
        accessor: "gender",
        Cell: ({ value }) => (
          <div className="hidden lg:block">
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                value === "Male"
                  ? "bg-blue-100 text-blue-800"
                  : value === "Female"
                  ? "bg-pink-100 text-pink-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {value}
            </span>
          </div>
        ),
      },
      {
        Header: "District",
        accessor: "district",
        Cell: ({ value }) => (
          <div className="hidden xl:block text-sm text-gray-600">{value}</div>
        ),
      },
      {
        Header: "Date",
        accessor: "contactDate",
        Cell: ({ value }) => (
          <div className="hidden sm:block text-sm text-gray-600">
            {moment(value).format("MMM DD, YYYY")}
          </div>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === contact.id ? null : contact.id
                  )
                }
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full transition-colors"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {activeDropdown === contact.id && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      router.push(`/dashboard/detail/${contact.id}`);
                      setActiveDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    👁️ View Details
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/edit-contact/${contact.id}`);
                      setActiveDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setSelectedContactForDeletion(contact);
                      setActiveDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [activeDropdown, router, setSelectedContactForDeletion]
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
    pageCount,
    gotoPage,
    state: { pageIndex },
    nextPage,
    previousPage,
  } = useTable(
    {
      columns,
      data: sortedData,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    usePagination
  );

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No contacts found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="min-w-full divide-y divide-gray-200"
        >
          <thead className="bg-gray-50">
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps()}
                    key={column.id}
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            {...getTableBodyProps()}
            className="bg-white divide-y divide-gray-200"
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      key={cell.column.id}
                      className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          {/* Results Info */}
          <div className="flex-1 flex justify-center sm:justify-start">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{pageIndex * 10 + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min((pageIndex + 1) * 10, sortedData.length)}
              </span>{" "}
              of <span className="font-medium">{sortedData.length}</span>{" "}
              results
            </p>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={previousPage}
              disabled={!canPreviousPage}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="hidden sm:flex space-x-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let pageNum;
                if (pageCount <= 5) {
                  pageNum = i;
                } else if (pageIndex < 3) {
                  pageNum = i;
                } else if (pageIndex > pageCount - 4) {
                  pageNum = pageCount - 5 + i;
                } else {
                  pageNum = pageIndex - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => gotoPage(pageNum)}
                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
                      pageIndex === pageNum
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Page Info (Mobile) */}
            <div className="sm:hidden flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {pageIndex + 1} of {pageOptions.length}
              </span>
            </div>

            {/* Next Button */}
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
