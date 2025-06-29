import React, { useEffect, useState } from "react";
import { Stage, Layer } from "react-konva";
import { useFloorManagement } from "../context/FloorManagementContext";
import TableComponent from "./TableComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

const FloorCanvas = () => {
  const {
    tables,
    tableStatuses,
    selectedId,
    statusFilter,
    stageRef,
    dragUrl,
    setSelectedId,
    setStatusFilter,
    addTable,
    getSortedTables,
    setTables,
    updateTablePosition
  } = useFloorManagement();

  // Responsive stage size state
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // State for selected floor
  const [selectedFloor, setSelectedFloor] = useState("floor-1");

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", updateSize);
    updateSize(); // Initial call
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  // Handle reservation Pin drag
  // @returns true if the table was successfully swapped, false otherwise
  const handleReservationPinDragEnd = (tableId, x, y) => {
    const originalTable = tables.find((table) => table.id === tableId);
    let overlappingTable = null;

    // Find if there's any overlapping table
    tables.forEach((table) => {
      if (table.id === tableId) return;

      const dx = Math.abs(x - table.x);
      const dy = Math.abs(y - table.y);

      // Check if the pin is overlapping with any existing table
      if (dx < table.width + 60 && dy < table.height + 60) {
        // If the table is reserved or occupied, prevent the swap
        if (table.status === "reserved") {
          alert("Cannot swap with a reserved table.");
          return false;
        }
        if (table.status === "occupied") {
          alert("Cannot swap with an occupied table.");
          return false;
        }
        overlappingTable = table;
      }
    });

    if (!overlappingTable) return false;

    // Update table statuses
    setTables(
      tables.map((t) => {
        if (t.id === overlappingTable.id) {
          return {
            ...t,
            status: originalTable.status,
            color: originalTable.color,
            reservationTime: originalTable.reservationTime,
          };
        }
        if (t.id === originalTable.id) {
          return {
            ...t,
            status: "free",
            reservationTime: null,
            color: tableStatuses.find((status) => status.id === "free").color,
          };
        }
        return t;
      })
    );
    return true;
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
    <div className="flex h-screen relative">
      {/* Status filter dropdown */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="fixed bottom-0 left-0"
          aria-label="Filter tables by status"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter Tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🔍 All Tables</SelectItem>
            {tableStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 items-center">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floor-1">Floor 1</SelectItem>
              <SelectItem value="floor-2">Floor 2</SelectItem>
              <SelectItem value="floor-3">Floor 3</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <PlusCircle />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {tableStatuses.map((status) => (
            <div key={status.id} className="flex items-center gap-1">
              <div
                className={`h-4 w-4 rounded-full`}
                style={{ backgroundColor: status.color }}
              />
              {status.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Stage Area */}
      <div
        className={`flex-1 bg-white relative transition-all duration-300`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
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
                handleReservationPinDragEnd={handleReservationPinDragEnd}
                onDragEnd={(e) => handleTableDragEnd(e, table.id)}
              />
            ))}
          </Layer>
          {/* This layer can be used for additional overlays like reservation pins */}
          <Layer name="top-layer" />
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
      </div>
    </div>
  );
};

export default FloorCanvas;
