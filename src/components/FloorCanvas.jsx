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
    userRole,
    setSelectedId,
    setStatusFilter,
    addTable,
    getSortedTables,
    setTables,
    updateTablePosition,
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

    if (!dragUrl.current || userRole !== "admin") return;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();

    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    addTable(dragUrl.current, position);
    dragUrl.current = null;
  };

  // Helper function to check if two rectangles overlap
  const checkOverlap = (rect1, rect2, threshold = 30) => {
    return !(
      rect1.x + rect1.width < rect2.x - threshold ||
      rect2.x + rect2.width < rect1.x - threshold ||
      rect1.y + rect1.height < rect2.y - threshold ||
      rect2.y + rect2.height < rect1.y - threshold
    );
  };

  // Handle reservation Pin drag
  // @returns true if the table was successfully swapped, false otherwise
  const handleReservationPinDragEnd = (tableId, x, y) => {
    if (userRole !== "tenant") return false;

    const originalTable = tables.find((table) => table.id === tableId);
    if (!originalTable) return false;

    let overlappingTable = null;
    let canSwap = true;

    // Create a rectangle for the dragged position
    const draggedRect = {
      x: x,
      y: y,
      width: originalTable.width || 80, // Default width if not specified
      height: originalTable.height || 80, // Default height if not specified
    };

    // Find overlapping table using proper collision detection
    for (const table of tables) {
      if (table.id === tableId) continue;

      const tableRect = {
        x: table.x,
        y: table.y,
        width: table.width || 80,
        height: table.height || 80,
      };

      // Check if rectangles overlap
      if (checkOverlap(draggedRect, tableRect)) {
        // Check if the overlapping table can be swapped
        if (table.status === "reserved") {
          alert("Cannot swap with a reserved table.");
          canSwap = false;
          break;
        }
        if (table.status === "occupied") {
          alert("Cannot swap with an occupied table.");
          canSwap = false;
          break;
        }
        overlappingTable = table;
        break; // Found the first overlapping table
      }
    }

    // If no valid overlap found or swap not allowed, return false
    if (!canSwap || !overlappingTable) {
      return false;
    }

    // Perform the swap
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
            color:
              tableStatuses.find((status) => status.id === "free")?.color ||
              "#green",
          };
        }
        return t;
      })
    );

    return true;
  };

  // Handle table drag on stage with overlap prevention
  const handleTableDragEnd = (e, tableId) => {
    // Only admin can move tables
    if (userRole !== "admin") return;

    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const draggedTable = tables.find((table) => table.id === tableId);
    if (!draggedTable) return;

    // Check for overlaps with other tables
    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: draggedTable.width || 80,
      height: draggedTable.height || 80,
    };

    // Check if the new position overlaps with any other table
    const hasOverlap = tables.some((table) => {
      if (table.id === tableId) return false;

      const tableRect = {
        x: table.x,
        y: table.y,
        width: table.width || 80,
        height: table.height || 80,
      };

      return checkOverlap(draggedRect, tableRect);
    });

    // Check if the table is within stage boundaries
    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + draggedRect.width <= stageSize.width &&
      newPosition.y + draggedRect.height <= stageSize.height;

    if (hasOverlap) {
      alert("Cannot place table here - it overlaps with another table.");
      // Reset to original position
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    if (!isWithinBounds) {
      alert("Cannot place table outside the floor area.");
      // Reset to original position
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    // Update position if no overlaps
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

        {userRole === "admin" && (
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
        )}

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
                userRole={userRole}
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
                {userRole === "admin"
                  ? "Drag tables from the sidebar to start designing your layout"
                  : "Floor plan ready for reservations"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorCanvas;
