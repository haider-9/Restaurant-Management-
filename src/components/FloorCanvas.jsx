import React from "react";
import { Stage, Layer } from "react-konva";
import { useFloorManagement } from "../context/FloorManagementContext";
import TableComponent from "./TableComponent";

const FloorCanvas = () => {
  const {
    tables,
    selectedId,
    sidebarVisible,
    statusFilter,
    stageRef,
    dragUrl,
    setSelectedId,
    setStatusFilter,
    addTable,
    updateTablePosition,
    toggleSidebar,
    getSortedTables,
  } = useFloorManagement();

  // Handle drag over stage
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on stage
  const handleDrop = (e) => {
    e.preventDefault();

    if (!dragUrl.current) return;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();

    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    addTable(dragUrl.current, position);
    dragUrl.current = null;
  };

  // Handle table drag on stage
  const handleTableDragEnd = (e, tableId) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    updateTablePosition(tableId, newPosition);
  };

  const sortedTables = getSortedTables();

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Status filter dropdown */}
      <div className="absolute top-4 left-4 z-10">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-8 focus:outline-none cursor-pointer hover:bg-gray-50 transition-all duration-300 transform "
          aria-label="Filter tables by status"
        >
          <option value="all">🔍 All Tables</option>
          <option value="free">✅ Free Tables</option>
          <option value="reserved">🕒 Reserved Tables</option>
          <option value="occupied">⭕ Occupied Tables</option>
        </select>
      </div>
      {/* Main Stage Area */}
      <div
        className={`flex-1 bg-white relative transition-all duration-300 ${
          sidebarVisible ? "mr-80" : "mr-0"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          width={window.innerWidth - (sidebarVisible ? 320 : 0)}
          height={window.innerHeight}
          ref={stageRef}
          onClick={(e) => {
            // Deselect when clicking empty area
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* Render tables */}
            {sortedTables.map((table) => (
              <TableComponent
                key={table.id}
                table={table}
                isSelected={table.id === selectedId}
                onSelect={() => setSelectedId(table.id)}
                onDragEnd={(e) => handleTableDragEnd(e, table.id)}
              />
            ))}
          </Layer>
        </Stage>

        {/* Instructions overlay */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <h3 className="text-2xl font-bold mb-2">Restaurant Floor Plan</h3>
              <p className="text-lg">
                Drag tables from the sidebar to start designing your layout
              </p>
            </div>
          </div>
        )}

        {/* Toggle sidebar button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-10"
        >
          {sidebarVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default FloorCanvas;
