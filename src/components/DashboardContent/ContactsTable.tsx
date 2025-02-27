"use client";

import React, { useMemo, useState } from "react";
import { useTable, usePagination, Column } from "react-table";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Entry } from ".";
// Adjust the import path as needed

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

  const columns: readonly Column<Entry>[] = useMemo(
    () => [
      { Header: "First Name", accessor: "firstName" },
      { Header: "Last Name", accessor: "lastName" },
      { Header: "Address", accessor: "address" },
      { Header: "Phone Number", accessor: "phone" },
      { Header: "Prayer Point", accessor: "prayerPoint" },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === contact.id ? null : contact.id
                  )
                }
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {activeDropdown === contact.id && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      router.push(`/edit-contact/${contact.id}`);
                      setActiveDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedContactForDeletion(contact);
                      setActiveDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Delete
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

  return (
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
                    key={cell.column.id}
                    className="px-6 py-4 text-sm text-gray-600"
                  >
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between items-center p-4">
        <button
          onClick={previousPage}
          disabled={!canPreviousPage}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition"
        >
          Previous
        </button>
        <span className="text-gray-700 font-medium">
          Page {pageIndex + 1} of {pageOptions.length}
        </span>
        <button
          onClick={nextPage}
          disabled={!canNextPage}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </section>
  );
}
