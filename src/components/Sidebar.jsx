import React from "react";
import { useFloorManagement } from "../context/FloorManagementContext";

const Sidebar = () => {
  const {
    tables,
    selectedId,
    sidebarVisible,
    tableTypes,
    tableStatuses,
    dragUrl,
    setSelectedId,
    deleteTable,
    clearAllTables,
    duplicateTable,
    changeTableStatus,
    setReservationTime,
    formatTime,
    formatDate,
    getSelectedTable,
  } = useFloorManagement();

  const selectedTable = getSelectedTable();

  // Handle drag start from sidebar
  const handleDragStart = (e, tableType) => {
    dragUrl.current = tableType;
  };

  return (
    <div
      className={`w-80 bg-gray-800 text-white p-6 overflow-y-auto fixed right-0 top-0 bottom-0 transition-transform duration-300 z-50 ${
        sidebarVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <h2 className="text-2xl font-bold mb-6">Floor Management</h2>

      {/* Floor Controls */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="font-bold mb-3">Floor Controls</h3>
        <div className="space-y-2">
          <button
            onClick={clearAllTables}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full transition-colors"
          >
            Clear All Tables ({tables.length})
          </button>
          {selectedId && (
            <>
              <button
                onClick={deleteTable}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 w-full transition-colors"
              >
                Delete Selected Table
              </button>
              <button
                onClick={duplicateTable}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full transition-colors"
              >
                Duplicate Selected Table
              </button>
            </>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-300">
          Total Tables: {tables.length} | Selected:{" "}
          {selectedTable ? `T${selectedTable.tableNumber}` : "None"}
        </div>
      </div>

      {/* Table Status Summary */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="font-bold mb-3">Table Status</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div
            className="p-2 rounded"
            style={{ backgroundColor: tableStatuses[0].color }}
          >
            <div className="font-bold text-white">
              {tables.filter((t) => t.status === "free").length}
            </div>
            <div className="text-xs text-white">Free</div>
          </div>
          <div
            className="p-2 rounded"
            style={{ backgroundColor: tableStatuses[2].color }}
          >
            <div className="font-bold text-white">
              {tables.filter((t) => t.status === "reserved").length}
            </div>
            <div className="text-xs text-white">Reserved</div>
          </div>
          <div
            className="p-2 rounded"
            style={{ backgroundColor: tableStatuses[1].color }}
          >
            <div className="font-bold text-white">
              {tables.filter((t) => t.status === "occupied").length}
            </div>
            <div className="text-xs text-white">Occupied</div>
          </div>
        </div>
      </div>

      {/* Selected Table Controls */}
      {selectedTable && (
        <div className="mb-6 p-4 bg-blue-900 rounded-lg">
          <h3 className="font-bold mb-3">
            Table T{selectedTable.tableNumber} Settings
          </h3>

          {/* Table Status Controls */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Table Status:</p>
            <div className="grid  gap-2">
              {tableStatuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => changeTableStatus(status.id)}
                  className={`py-1 px-2 rounded text-sm ${
                    selectedTable.status === status.id
                      ? "border-2 border-white"
                      : "border border-gray-600"
                  }`}
                  style={{ backgroundColor: status.color }}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </div>

          {/* Reservation Time */}
          {selectedTable.status === "reserved" && (
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Reservation Time:</p>
              <input
                type="time"
                value={
                  selectedTable.reservationTime
                    ? new Date(
                        selectedTable.reservationTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : ""
                }
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const date = new Date();
                  date.setHours(parseInt(hours, 10));
                  date.setMinutes(parseInt(minutes, 10));
                  date.setSeconds(0);
                  setReservationTime(date.toISOString());
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                {selectedTable.reservationTime
                  ? `Reserved for: ${formatTime(selectedTable.reservationTime)}`
                  : "Set reservation time"}
              </p>
            </div>
          )}

          {/* Table Info */}
          <div className="text-sm text-gray-300">
            <p>Seats: {selectedTable.seats}</p>
            <p>
              Position: ({Math.round(selectedTable.x)},{" "}
              {Math.round(selectedTable.y)})
            </p>
            <p>
              Size: {selectedTable.width}×{selectedTable.height}
            </p>
            <p>
              Created: {formatTime(selectedTable.createdAt)}{" "}
              {formatDate(selectedTable.createdAt)}
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Reservations */}
      {tables.filter((t) => t.status === "reserved" && t.reservationTime)
        .length > 0 && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="font-bold mb-3">Upcoming Reservations</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tables
              .filter((t) => t.status === "reserved" && t.reservationTime)
              .sort(
                (a, b) =>
                  new Date(a.reservationTime) - new Date(b.reservationTime)
              )
              .map((table) => (
                <div
                  key={table.id}
                  className={`p-2 rounded flex justify-between items-center ${
                    table.id === selectedId ? "bg-blue-800" : "bg-gray-600"
                  } cursor-pointer hover:bg-gray-500`}
                  onClick={() => setSelectedId(table.id)}
                >
                  <div>
                    <span className="font-bold">T{table.tableNumber}</span>
                    <span className="text-xs ml-2">({table.seats} seats)</span>
                  </div>
                  <div className="text-white font-medium">
                    {formatTime(table.reservationTime)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table Types */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Add Tables</h3>
        <div className="space-y-4">
          {tableTypes.map((tableType) => (
            <div
              key={tableType.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tableType)}
              className="bg-gray-700 p-4 rounded-lg cursor-move hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-gray-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{tableType.name}</h4>
                  <p className="text-sm text-gray-300">
                    {tableType.seats} seats
                  </p>
                  <p className="text-xs text-gray-400">
                    Size: {tableType.width}×{tableType.height}
                  </p>
                </div>
                <div className="text-center">
                  <div
                    className="w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold mb-1"
                    style={{ backgroundColor: tableStatuses[0].color }}
                  >
                    {tableType.seats}
                  </div>
                  <p className="text-xs text-gray-400">Drag to add</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="font-bold mb-3">Help</h3>
        <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
          <li>Drag tables from the sidebar to the floor plan</li>
          <li>Click on a table to select it</li>
          <li>Drag tables to reposition them</li>
          <li>
            Set table status:
            <ul className="ml-4 mt-1">
              <li>
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: tableStatuses[0].color }}
                ></span>{" "}
                Free (Green)
              </li>
              <li>
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: tableStatuses[1].color }}
                ></span>{" "}
                Occupied (Blue)
              </li>
              <li>
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: tableStatuses[2].color }}
                ></span>{" "}
                Reserved (Gray)
              </li>
            </ul>
          </li>
          <li>Set reservation times for reserved tables</li>
          <li>Filter tables by status using the dropdown</li>
          <li>
            Toggle sidebar visibility with the button in the top-right corner
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Restaurant Floor Management Tool</p>
        <p className="mt-1">© {new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </div>
  );
};

export default Sidebar;
