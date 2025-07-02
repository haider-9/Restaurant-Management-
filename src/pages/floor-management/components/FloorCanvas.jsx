import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer } from "react-konva";
import { useFloorManagement } from "../context/FloorManagementContext";
import TableComponent from "./TableComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Dialog } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const FloorCanvas = () => {
  const {
    tables,
    tableStatuses,
    selectedId,
    stageRef,
    dragUrl,
    userRole,
    sidebarVisible,
    drawingMode,
    drawnRectangles,
    setDrawnRectangles,
    setSelectedId,
    addElement,
    addDrawnRectangle,
    setTables,
    barCreated,
    setBarCreated,
    barName,
    setBarName,
    updateTablePosition,
    transferReservation,
    updateBarDimensions, // Add this to context
  } = useFloorManagement();

  // Add transformer ref
  const transformerRef = useRef();
  const selectedBarRef = useRef();

  // Responsive stage size state
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // State for selected floor
  const [selectedFloor, setSelectedFloor] = useState("floor-1");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);

  // Reservation drag state
  const [draggedReservation, setDraggedReservation] = useState(null);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && selectedBarRef.current) {
      // Check if selected item is a bar
      const selectedBar = drawnRectangles.find((bar) => bar.id === selectedId);
      if (selectedBar && userRole === "admin") {
        transformerRef.current.nodes([selectedBarRef.current]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, drawnRectangles, userRole]);

  // Update stage size on window resize and sidebar toggle
  useEffect(() => {
    const updateSize = () => {
      // Calculate available width considering sidebar
      const availableWidth = sidebarVisible
        ? window.innerWidth - 384 // 384px = w-96 (24rem)
        : window.innerWidth;

      setStageSize({
        width: Math.max(availableWidth, 400), // Minimum width
        height: window.innerHeight,
      });
    };

    updateSize(); // Initial call
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, [sidebarVisible]);

  // Handle drag over stage
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on stage
  const handleDrop = (e) => {
    e.preventDefault();

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();

    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Handle reservation drop from sidebar
    if (draggedReservation) {
      handleReservationDropOnStage(position);
      return;
    }

    // Handle table/element drop
    if (!dragUrl.current || userRole !== "admin") return;

    addElement(dragUrl.current, position);
    dragUrl.current = null;
  };

  // Handle reservation drop from sidebar to stage
  const handleReservationDropOnStage = (dropPosition) => {
    if (!draggedReservation) return;

    // Find table at drop position
    const targetTable = tables.find((table) => {
      if (table.type !== "table") return false;

      return (
        dropPosition.x >= table.x &&
        dropPosition.x <= table.x + table.width &&
        dropPosition.y >= table.y &&
        dropPosition.y <= table.y + table.height
      );
    });

    if (!targetTable) return;

    if (targetTable.id === draggedReservation.id) {
      toast.info("Drop reservation on an available table to transfer");
      return;
    }

    if (targetTable.status !== "available") {
      toast.error(`Table ${targetTable.tableNumber} is not available`);
      return;
    }

    transferReservation(draggedReservation.id, targetTable.id);
    toast.success(
      `Reservation transferred to Table ${targetTable.tableNumber}`
    );

    setDraggedReservation(null);
  };

  // Handle drawing mode mouse events
  const handleStageMouseDown = (e) => {
    if (!drawingMode || userRole !== "admin") return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    // Check if pointer overlaps with any existing rectangles
    const hasOverlap = drawnRectangles.some((rect) => {
      return (
        pointer.x >= rect.x &&
        pointer.x <= rect.x + rect.width &&
        pointer.y >= rect.y &&
        pointer.y <= rect.y + rect.height
      );
    });

    if (hasOverlap) {
      toast.error("Cannot draw over existing Bars");
      return;
    }

    setIsDrawing(true);
    setDrawStart(pointer);
    setCurrentRect({
      x: pointer.x,
      y: pointer.y,
      width: 0,
      height: 0,
    });
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || !drawStart || !drawingMode) return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    // Check if current drawing overlaps with any existing rectangles
    const tempRect = {
      x: Math.min(drawStart.x, pointer.x),
      y: Math.min(drawStart.y, pointer.y),
      width: Math.abs(pointer.x - drawStart.x),
      height: Math.abs(pointer.y - drawStart.y),
    };

    const hasOverlap = drawnRectangles.some((rect) =>
      checkOverlap(tempRect, rect)
    );

    if (hasOverlap) {
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentRect(null);
      toast.warn("Cannot draw over existing rectangles");
      return;
    }

    setCurrentRect(tempRect);
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || !currentRect || !drawingMode) return;

    // Only add rectangle if it has meaningful size
    if (currentRect.width > 10 && currentRect.height > 10) {
      addDrawnRectangle(currentRect);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  // Helper function to check if two rectangles overlap
  const checkOverlap = (rect1, rect2) => {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  };

  // Handle reservation Pin drag
  const handleReservationPinDragEnd = (tableId, x, y) => {
    if (userRole !== "tenant") return false;

    const originalTable = tables.find((table) => table.id === tableId);
    if (!originalTable || originalTable.type !== "table") return false;

    let overlappingTable = null;
    let canSwap = true;

    // Create a rectangle for the dragged position
    const draggedRect = {
      x: x,
      y: y,
      width: originalTable.width || 80,
      height: originalTable.height || 80,
    };

    // Find overlapping table using proper collision detection
    for (const table of tables) {
      if (table.id === tableId || table.type !== "table") continue;

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
          toast.error("The table is already reserved.");
          canSwap = false;
          break;
        }
        if (table.status === "occupied") {
          toast.error("The table is already occupied.");
          canSwap = false;
          break;
        }
        overlappingTable = table;
        break;
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
            reservationName: originalTable.reservationName,
            reservationTime: originalTable.reservationTime,
          };
        }
        if (t.id === originalTable.id) {
          return {
            ...t,
            status: "available",
            reservationName: "",
            reservationTime: null,
            color:
              tableStatuses.find((status) => status.id === "available")
                ?.color || "#10b981",
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
      newPosition.x + draggedRect.width <= stageSize.width - 270 &&
      newPosition.y + draggedRect.height <= stageSize.height;

    if (hasOverlap) {
      toast.warn("Cannot place table here - it overlaps with another table.");
      // Reset to original position
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    if (!isWithinBounds) {
      toast.error("Cannot place table outside the floor area.");
      // Reset to original position
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    // Update position if no overlaps
    updateTablePosition(tableId, newPosition);
  };

  const handleBarDragEnd = (e, barId) => {
    if (userRole !== "admin") return;

    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    // Find the dragged rectangle
    const draggedBar = drawnRectangles.find((bar) => bar.id === barId);
    if (!draggedBar) return;

    const width = draggedBar.width || 80;
    const height = draggedBar.height || 90;

    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width,
      height,
    };

    // Check overlap with other rectangles
    const hasOverlap = drawnRectangles.some((bar) => {
      if (bar.id === barId) return false;

      const barRect = {
        x: bar.x,
        y: bar.y,
        width: bar.width || 80,
        height: bar.height || 90,
      };

      return checkOverlap(draggedRect, barRect);
    });

    // Check if within stage bounds
    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + width <= stageSize.width - 270 &&
      newPosition.y + height <= stageSize.height;

    // Handle overlap case - reset to original position
    if (hasOverlap) {
      toast.warn("Cannot place bar here - it overlaps with another bar.");
      // Force the visual element back to original position
      e.target.x(draggedBar.x);
      e.target.y(draggedBar.y);
      // Force stage redraw
      e.target.getStage().batchDraw();
      return;
    }

    // Handle out-of-bounds case - reset to original position
    if (!isWithinBounds) {
      toast.error("Cannot place bar outside the floor area.");
      // Force the visual element back to original position
      e.target.x(draggedBar.x);
      e.target.y(draggedBar.y);
      // Force stage redraw
      e.target.getStage().batchDraw();
      return;
    }

    // Update the bar position in drawnRectangles state
    setDrawnRectangles((prev) =>
      prev.map((bar) =>
        bar.id === barId ? { ...bar, x: newPosition.x, y: newPosition.y } : bar
      )
    );
  };

  // Handle transformer transform end (for resizing)
  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Get the selected bar
    const selectedBar = drawnRectangles.find((bar) => bar.id === selectedId);
    if (!selectedBar) return;

    // Calculate new dimensions
    const newWidth = Math.max(50, selectedBar.width * scaleX); // Minimum width of 50
    const newHeight = Math.max(30, selectedBar.height * scaleY); // Minimum height of 30

    // Get current position (might have changed during transform)
    const newX = node.x();
    const newY = node.y();

    // Reset scale to 1 (we'll update the actual dimensions)
    node.scaleX(1);
    node.scaleY(1);

    // Check for overlaps with new dimensions
    const transformedRect = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };

    // Check overlap with other bars
    const hasOverlap = drawnRectangles.some((bar) => {
      if (bar.id === selectedId) return false;

      const barRect = {
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: bar.height,
      };

      return checkOverlap(transformedRect, barRect);
    });

    // Check if within stage bounds
    const isWithinBounds =
      newX >= 0 &&
      newY >= 0 &&
      newX + newWidth <= stageSize.width - 270 &&
      newY + newHeight <= stageSize.height;

    if (hasOverlap) {
      toast.warn("Cannot resize bar - it would overlap with another bar.");
      // Reset to original dimensions and position
      node.x(selectedBar.x);
      node.y(selectedBar.y);
      node.getStage().batchDraw();
      return;
    }

    if (!isWithinBounds) {
      toast.error("Cannot resize bar - it would go outside the floor area.");
      // Reset to original dimensions and position
      node.x(selectedBar.x);
      node.y(selectedBar.y);
      node.getStage().batchDraw();
      return;
    }

    // Update the bar dimensions and position in state
    setDrawnRectangles((prev) =>
      prev.map((bar) =>
        bar.id === selectedId
          ? {
              ...bar,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            }
          : bar
      )
    );
  };

  // Expose drag functions to window for sidebar access
  useEffect(() => {
    window.setDraggedReservation = setDraggedReservation;
    return () => {
      delete window.setDraggedReservation;
    };
  }, []);

  return (
    <div
      className={`flex h-screen relative transition-all duration-300 ${
        sidebarVisible ? "mr-96" : "mr-0"
      }`}
    >
      {/* Status filter dropdown */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
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

      <Dialog open={barCreated} onOpenChange={setBarCreated}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-semibold">
              Enter a name for the bar
            </DialogTitle>
          </DialogHeader>

          <Input
            value={barName}
            onChange={(e) => setBarName(e.target.value)}
            placeholder="Enter bar name"
            aria-label="Bar name"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setBarCreated(false);
                setBarName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (barName.trim()) {
                  setDrawnRectangles((prevRectangles) =>
                    prevRectangles.map((rect, index) =>
                      index === prevRectangles.length - 1
                        ? { ...rect, text: barName.trim() }
                        : rect
                    )
                  );
                  setBarCreated(false);
                  setBarName("");
                }
              }}
              disabled={!barName.trim()}
              aria-label="Submit bar name"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Stage Area */}
      <div
        className="flex-1 bg-white relative transition-all duration-300"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onMouseDown={drawingMode ? handleStageMouseDown : undefined}
          onMouseMove={drawingMode ? handleStageMouseMove : undefined}
          onMouseUp={drawingMode ? handleStageMouseUp : undefined}
          onClick={(e) => {
            // Deselect when clicking empty area (only if not drawing)
            if (!drawingMode && e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* Render drawn rectangles */}
            {drawnRectangles.map((rect) => (
              <Group
                key={rect.id}
                x={rect.x}
                y={rect.y}
                draggable={userRole === "admin" && selectedId !== rect.id} // Disable drag when selected for transform
                onClick={() => setSelectedId(rect.id)}
                onDragEnd={(e) => handleBarDragEnd(e, rect.id)}
                ref={selectedId === rect.id ? selectedBarRef : null}
                onTransformEnd={handleTransformEnd}
              >
                <Rect
                  width={rect.width}
                  height={rect.height}
                  fill="#f3f4f9"
                  stroke={selectedId === rect.id ? "#2563eb" : "#4b5563"}
                  strokeWidth={selectedId === rect.id ? 3 : 2}
                />
                <Text
                  x={rect.width / 2}
                  y={rect.height / 2}
                  text={rect.text}
                  fontSize={16}
                  fill="#4b5563"
                  align="center"
                  verticalAlign="middle"
                  width={rect.width}
                  height={rect.height}
                  offsetX={rect.width / 2}
                  offsetY={rect.height / 2}
                />
              </Group>
            ))}

            {/* Render current drawing rectangle */}
            {currentRect && isDrawing && (
              <Rect
                x={currentRect.x}
                y={currentRect.y}
                width={currentRect.width}
                height={currentRect.height}
                fill="#f3f4f9"
                stroke="#4b5563"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}

            {/* Render tables and other elements */}
            {tables.map((table) => (
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

            {/* Transformer for selected bars */}
            {userRole === "admin" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit minimum size
                  if (newBox.width < 50 || newBox.height < 30) {
                    return oldBox;
                  }
                  return newBox;
                }}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                  "top-center",
                  "bottom-center",
                  "middle-left",
                  "middle-right",
                ]}
                rotateEnabled={false} // Disable rotation
                borderStroke="#2563eb"
                borderStrokeWidth={2}
                anchorFill="#2563eb"
                anchorStroke="#1d4ed8"
                anchorSize={8}
              />
            )}
          </Layer>
          {/* This layer can be used for additional overlays like reservation pins */}
          <Layer name="top-layer" />
        </Stage>

        {/* Instructions overlay */}
        {tables.length === 0 ||
          (drawnRectangles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  Restaurant Floor Plan
                </h3>
                <p className="text-lg">
                  {userRole === "admin"
                    ? "Drag tables from the sidebar to start designing your layout"
                    : "Floor plan ready for reservations"}
                </p>
              </div>
            </div>
          ))}

        {/* Drawing mode indicator */}
        {drawingMode && (
          <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">🎨 Drawing Mode Active</p>
            <p className="text-xs">Click and drag to draw bars</p>
          </div>
        )}

        {/* Transform mode indicator */}
        {selectedId &&
          drawnRectangles.find((bar) => bar.id === selectedId) &&
          userRole === "admin" && (
            <div className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">🔧 Transform Mode</p>
              <p className="text-xs">
                Drag corners to resize, drag center to move
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default FloorCanvas;
