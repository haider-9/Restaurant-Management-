import { useEffect, useState, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Transformer,
  Circle,
  Image,
} from "react-konva";
import { useFloorManagement } from "../hooks/use-Floor-Management";
import TableComponent from "./TableComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import { toast } from "react-toastify";
import { Dialog } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Html } from "react-konva-utils";
import { tableStatuses } from "../constants";
import { checkOverlap } from "../lib/utils";

const FloorCanvas = () => {
  const doorImage = "/Door.svg";
  const plantImage = "/Plant.png";

  const {
    elements,
    setElements,
    selectedId,
    stageRef,
    dragUrl,
    userRole,
    drawingMode,
    circleDrawingMode,
    setSelectedId,
    addElement,
    barCreated,
    setBarCreated,
    barName,
    setBarName,
    updateTablePosition,
    transferReservation,
    setSidebarVisible,
    setDrawingMode,
    setCircleDrawingMode,
  } = useFloorManagement();

  // Local state for circle dialog if not provided by hook
  const [localCircleCreated, setLocalCircleCreated] = useState(false);
  const [localCircleName, setLocalCircleName] = useState("");

  // Use hook values if available, otherwise use local state
  const circleCreated = localCircleCreated;
  const setCircleCreated = setLocalCircleCreated;
  const circleName = localCircleName;
  const setCircleName = setLocalCircleName;

  // Add transformer ref
  const transformerRef = useRef();
  const selectedBarRef = useRef();
  const selectedCircleRef = useRef();
  const selectedDoorRef = useRef();
  const selectedPlantRef = useRef();

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [selectedFloor, setSelectedFloor] = useState("floor-1");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [currentCircle, setCurrentCircle] = useState(null);

  const [draggedReservation, setDraggedReservation] = useState(null);

  // Load images
  const [doorImg, setDoorImg] = useState(null);
  const [plantImg, setPlantImg] = useState(null);

  useEffect(() => {
    const loadImages = () => {
      const door = new window.Image();
      door.src = doorImage;
      door.onload = () => {
        console.log("Door image loaded successfully");
        setDoorImg(door);
      };
      door.onerror = () => {
        console.error("Failed to load door image:", doorImage);
      };

      const plant = new window.Image();
      plant.src = plantImage;
      plant.onload = () => {
        console.log("Plant image loaded successfully");
        setPlantImg(plant);
      };
      plant.onerror = () => {
        console.error("Failed to load plant image:", plantImage);
      };
    };

    loadImages();
  }, []);

  // Only show elements for the selected floor
  const bars = elements.filter(
    (element) => element.type === "bar" && element.floorId === selectedFloor
  );
  const circles = elements.filter(
    (element) => element.type === "circle" && element.floorId === selectedFloor
  );
  const tables = elements.filter(
    (element) => element.type === "table" && element.floorId === selectedFloor
  );
  const doors = elements.filter(
    (element) => element.type === "door" && element.floorId === selectedFloor
  );
  const plants = elements.filter(
    (element) => element.type === "plant" && element.floorId === selectedFloor
  );

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedBar = bars.find((bar) => bar.id === selectedId);
      const selectedCircle = circles.find((circle) => circle.id === selectedId);
      const selectedDoor = doors.find((door) => door.id === selectedId);
      const selectedPlant = plants.find((plant) => plant.id === selectedId);

      if (selectedBar && userRole === "admin" && selectedBarRef.current) {
        transformerRef.current.nodes([selectedBarRef.current]);
        transformerRef.current.getLayer().batchDraw();
      } else if (
        selectedCircle &&
        userRole === "admin" &&
        selectedCircleRef.current
      ) {
        transformerRef.current.nodes([selectedCircleRef.current]);
        transformerRef.current.getLayer().batchDraw();
      } else if (
        selectedDoor &&
        userRole === "admin" &&
        selectedDoorRef.current
      ) {
        transformerRef.current.nodes([selectedDoorRef.current]);
        transformerRef.current.getLayer().batchDraw();
      } else if (
        selectedPlant &&
        userRole === "admin" &&
        selectedPlantRef.current
      ) {
        transformerRef.current.nodes([selectedPlantRef.current]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, bars, circles, doors, plants, userRole]);

  // Update stage size on window resize and sidebar toggle
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setSidebarVisible(false);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

    // Check what type of element is being dropped
    if (dragUrl.current === "door") {
      addDoorElement(position);
    } else if (dragUrl.current === "plant") {
      addPlantElement(position);
    } else {
      // Default case (tables, bars, etc.)
      addElementWithFloor(dragUrl.current, position);
    }

    dragUrl.current = null;
  };

  // Handle reservation drop from sidebar to stage
  const handleReservationDropOnStage = (dropPosition) => {
    if (!draggedReservation) return;

    const targetTable = tables.find(
      (table) =>
        dropPosition.x >= table.x &&
        dropPosition.x <= table.x + table.width &&
        dropPosition.y >= table.y &&
        dropPosition.y <= table.y + table.height
    );

    if (!targetTable) return;

    if (targetTable.id === draggedReservation.id) {
      toast.info(
        `Drop reservation on an available table-${targetTable.tableNumber} to transfer`
      );
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

  // Utility function to check circle overlap
  const checkCircleOverlap = (circle1, circle2) => {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
  };

  // Modified addElement function to handle circles, with floorId
  const addCircleElement = (circleData, position) => {
    const newCircle = {
      id: `circle-${Date.now()}`,
      type: "circle",
      x: position.x,
      y: position.y,
      radius: circleData.radius,
      text: "",
      floorId: selectedFloor,
    };
    setElements((prev) => [...prev, newCircle]);
    setCircleCreated(true);
    // Exit drawing mode after creating circle
    if (setCircleDrawingMode) {
      setCircleDrawingMode(false);
    }
  };

  // Patch addElement to always add floorId for new elements
  const addElementWithFloor = (element, position) => {
    const newElement = {
      ...element,
      x: position.x,
      y: position.y,
      floorId: selectedFloor,
    };

    // Set default dimensions based on type if not provided
    if (element.type === "door" && !element.width) {
      newElement.width = 80;
      newElement.height = 20;
    }
    if (element.type === "plant" && !element.width) {
      newElement.width = 60;
      newElement.height = 60;
    }

    setElements((prev) => [...prev, newElement]);

    // For doors and plants, we don't need a name dialog
    if (element.type === "bar") {
      setBarCreated(true);
      // Exit drawing mode after creating bar
      if (setDrawingMode) {
        setDrawingMode(false);
      }
    } else if (element.type === "circle") {
      setCircleCreated(true);
      // Exit drawing mode after creating circle
      if (setCircleDrawingMode) {
        setCircleDrawingMode(false);
      }
    }
  };

  // Add door element
  const addDoorElement = (position) => {
    addElementWithFloor(
      {
        id: `door-${Date.now()}`,
        type: "door",
        width: 80,
        height: 20,
        rotation: 0,
      },
      position
    );
  };

  // Add plant element
  const addPlantElement = (position) => {
    addElementWithFloor(
      {
        id: `plant-${Date.now()}`,
        type: "plant",
        width: 60,
        height: 60,
      },
      position
    );
  };

  // Handle drawing mode mouse events
  const handleStageMouseDown = (e) => {
    if ((!drawingMode && !circleDrawingMode) || userRole !== "admin") return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    if (drawingMode) {
      const hasOverlap = bars.some(
        (rect) =>
          pointer.x >= rect.x &&
          pointer.x <= rect.x + rect.width &&
          pointer.y >= rect.y &&
          pointer.y <= rect.y + rect.height
      );

      if (hasOverlap) {
        toast.error("Cannot draw over existing bars");
        return;
      }

      setIsDrawing(true);
      setDrawStart(pointer);
      setCurrentRect({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
        type: "bar",
      });
    } else if (circleDrawingMode) {
      const hasOverlap = circles.some((circle) => {
        const dx = pointer.x - circle.x;
        const dy = pointer.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle.radius;
      });

      if (hasOverlap) {
        toast.error("Cannot draw over existing circles");
        return;
      }

      setIsDrawing(true);
      setDrawStart(pointer);
      setCurrentCircle({
        x: pointer.x,
        y: pointer.y,
        radius: 0,
        type: "circle",
      });
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || !drawStart || (!drawingMode && !circleDrawingMode))
      return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    if (drawingMode) {
      const tempRect = {
        x: Math.min(drawStart.x, pointer.x),
        y: Math.min(drawStart.y, pointer.y),
        width: Math.abs(pointer.x - drawStart.x),
        height: Math.abs(pointer.y - drawStart.y),
      };

      const hasOverlap = bars.some((rect) => checkOverlap(tempRect, rect));
      if (hasOverlap) {
        setIsDrawing(false);
        setDrawStart(null);
        setCurrentRect(null);
        toast.warn("Cannot draw over existing rectangles");
        return;
      }
      setCurrentRect({ ...tempRect, type: "bar" });
    } else if (circleDrawingMode) {
      const dx = pointer.x - drawStart.x;
      const dy = pointer.y - drawStart.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      const tempCircle = {
        x: drawStart.x,
        y: drawStart.y,
        radius: radius,
      };

      const hasOverlap = circles.some((circle) =>
        checkCircleOverlap(tempCircle, circle)
      );
      if (hasOverlap) {
        setIsDrawing(false);
        setDrawStart(null);
        setCurrentCircle(null);
        toast.warn("Cannot draw over existing circles");
        return;
      }
      setCurrentCircle({ ...tempCircle, type: "circle" });
    }
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || (!drawingMode && !circleDrawingMode)) return;

    if (
      drawingMode &&
      currentRect &&
      currentRect.width > 10 &&
      currentRect.height > 10
    ) {
      addElementWithFloor(currentRect, { x: currentRect.x, y: currentRect.y });
    } else if (
      circleDrawingMode &&
      currentCircle &&
      currentCircle.radius > 10
    ) {
      console.log("Adding circle with radius:", currentCircle.radius);
      addCircleElement(currentCircle, {
        x: currentCircle.x,
        y: currentCircle.y,
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
    setCurrentCircle(null);
  };

  // Handle reservation Pin drag
  const handleReservationPinDragEnd = (tableId, x, y) => {
    if (userRole !== "tenant") return false;

    const originalTable = tables.find((table) => table.id === tableId);
    if (!originalTable || originalTable.type !== "table") return false;

    let overlappingTable = null;
    let canSwap = true;

    const draggedRect = {
      x: x,
      y: y,
      width: originalTable.width || 80,
      height: originalTable.height || 80,
    };

    for (const table of tables) {
      if (table.id === tableId || table.type !== "table") continue;

      const tableRect = {
        x: table.x,
        y: table.y,
        width: table.width || 80,
        height: table.height || 80,
      };

      if (checkOverlap(draggedRect, tableRect)) {
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

    if (!canSwap || !overlappingTable) {
      return false;
    }

    setElements(
      elements.map((element) => {
        if (element.type !== "table") return element;

        if (element.id === overlappingTable.id) {
          return {
            ...element,
            status: originalTable.status,
            color: originalTable.color,
            reservationName: originalTable.reservationName,
            reservationTime: originalTable.reservationTime,
          };
        }
        if (element.id === originalTable.id) {
          return {
            ...element,
            status: "available",
            reservationName: "",
            reservationTime: null,
            color:
              tableStatuses.find((status) => status.id === "available")
                ?.color || "#10b981",
          };
        }
        return element;
      })
    );

    return true;
  };

  // Handle table drag on stage with overlap prevention
  const handleTableDragEnd = (e, tableId) => {
    if (userRole !== "admin") return;

    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const draggedTable = tables.find((table) => table.id === tableId);
    if (!draggedTable) return;

    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: draggedTable.width || 80,
      height: draggedTable.height || 80,
    };

    const hasOverlap = [
      ...tables,
      ...bars,
      ...circles,
      ...doors,
      ...plants,
    ].some((element) => {
      if (element.id === tableId) return false;

      const elementRect = {
        x: element.x,
        y: element.y,
        width: element.width || 80,
        height: element.height || 80,
      };

      return checkOverlap(draggedRect, elementRect);
    });

    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + draggedRect.width <= stageSize.width - 270 &&
      newPosition.y + draggedRect.height <= stageSize.height;

    if (hasOverlap) {
      toast.warn("Cannot place table here - it overlaps with another element.");
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    if (!isWithinBounds) {
      toast.error("Cannot place table outside the floor area.");
      e.target.x(draggedTable.x);
      e.target.y(draggedTable.y);
      return;
    }

    updateTablePosition(tableId, newPosition);
  };

  // Bar drag end (update elements)
  const handleBarDragEnd = (e, barId) => {
    if (userRole !== "admin") return;
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    const draggedBar = bars.find((bar) => bar.id === barId);
    if (!draggedBar) return;
    const width = draggedBar.width || 80;
    const height = draggedBar.height || 90;
    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width,
      height,
    };
    const hasOverlap = [
      ...bars,
      ...tables,
      ...circles,
      ...doors,
      ...plants,
    ].some((element) => {
      if (element.id === barId) return false;
      const elementRect = {
        x: element.x,
        y: element.y,
        width: element.width || 80,
        height: element.height || 90,
      };
      return checkOverlap(draggedRect, elementRect);
    });
    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + width <= stageSize.width - 270 &&
      newPosition.y + height <= stageSize.height;
    if (hasOverlap) {
      toast.warn("Cannot place bar here - it overlaps with another element.");
      e.target.x(draggedBar.x);
      e.target.y(draggedBar.y);
      e.target.getStage().batchDraw();
      return;
    }
    if (!isWithinBounds) {
      toast.error("Cannot place bar outside the floor area.");
      e.target.x(draggedBar.x);
      e.target.y(draggedBar.y);
      e.target.getStage().batchDraw();
      return;
    }
    setElements((prev) =>
      prev.map((bar) =>
        bar.id === barId ? { ...bar, x: newPosition.x, y: newPosition.y } : bar
      )
    );
  };

  // Circle drag end (update elements)
  const handleCircleDragEnd = (e, circleId) => {
    if (userRole !== "admin") return;
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    const draggedCircle = circles.find((circle) => circle.id === circleId);
    if (!draggedCircle) return;
    const radius = draggedCircle.radius || 40;
    const draggedCircleData = {
      x: newPosition.x,
      y: newPosition.y,
      radius,
    };
    const hasOverlap = [
      ...circles,
      ...tables,
      ...bars,
      ...doors,
      ...plants,
    ].some((element) => {
      if (element.id === circleId) return false;
      if (element.type === "circle") {
        return checkCircleOverlap(draggedCircleData, element);
      } else {
        // Check overlap with other element types using bounding boxes
        const elementRect = {
          x: element.x,
          y: element.y,
          width: element.width || 80,
          height: element.height || 80,
        };
        const circleRect = {
          x: newPosition.x - radius,
          y: newPosition.y - radius,
          width: radius * 2,
          height: radius * 2,
        };
        return checkOverlap(circleRect, elementRect);
      }
    });
    const isWithinBounds =
      newPosition.x - radius >= 0 &&
      newPosition.y - radius >= 0 &&
      newPosition.x + radius <= stageSize.width - 270 &&
      newPosition.y + radius <= stageSize.height;
    if (hasOverlap) {
      toast.warn(
        "Cannot place circle here - it overlaps with another element."
      );
      e.target.x(draggedCircle.x);
      e.target.y(draggedCircle.y);
      e.target.getStage().batchDraw();
      return;
    }
    if (!isWithinBounds) {
      toast.error("Cannot place circle outside the floor area.");
      e.target.x(draggedCircle.x);
      e.target.y(draggedCircle.y);
      e.target.getStage().batchDraw();
      return;
    }
    setElements((prev) =>
      prev.map((circle) =>
        circle.id === circleId
          ? { ...circle, x: newPosition.x, y: newPosition.y }
          : circle
      )
    );
  };

  // Handle door drag end
  const handleDoorDragEnd = (e, doorId) => {
    if (userRole !== "admin") return;
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    const draggedDoor = doors.find((door) => door.id === doorId);
    if (!draggedDoor) return;

    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: draggedDoor.width,
      height: draggedDoor.height,
    };

    // Check overlap with other elements
    const hasOverlap = [
      ...bars,
      ...circles,
      ...tables,
      ...plants,
      ...doors,
    ].some((element) => {
      if (element.id === doorId) return false;

      const elementRect = {
        x: element.x,
        y: element.y,
        width: element.width || 0,
        height: element.height || 0,
      };

      return checkOverlap(draggedRect, elementRect);
    });

    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + draggedDoor.width <= stageSize.width - 270 &&
      newPosition.y + draggedDoor.height <= stageSize.height;

    if (hasOverlap) {
      toast.warn("Cannot place door here - it overlaps with another element.");
      e.target.x(draggedDoor.x);
      e.target.y(draggedDoor.y);
      return;
    }

    if (!isWithinBounds) {
      toast.error("Cannot place door outside the floor area.");
      e.target.x(draggedDoor.x);
      e.target.y(draggedDoor.y);
      return;
    }

    setElements((prev) =>
      prev.map((door) =>
        door.id === doorId
          ? { ...door, x: newPosition.x, y: newPosition.y }
          : door
      )
    );
  };

  // Handle plant drag end
  const handlePlantDragEnd = (e, plantId) => {
    if (userRole !== "admin") return;
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    const draggedPlant = plants.find((plant) => plant.id === plantId);
    if (!draggedPlant) return;

    const draggedRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: draggedPlant.width,
      height: draggedPlant.height,
    };

    // Check overlap with other elements
    const hasOverlap = [
      ...bars,
      ...circles,
      ...tables,
      ...doors,
      ...plants,
    ].some((element) => {
      if (element.id === plantId) return false;

      const elementRect = {
        x: element.x,
        y: element.y,
        width: element.width || 0,
        height: element.height || 0,
      };

      return checkOverlap(draggedRect, elementRect);
    });

    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.y >= 0 &&
      newPosition.x + draggedPlant.width <= stageSize.width - 270 &&
      newPosition.y + draggedPlant.height <= stageSize.height;

    if (hasOverlap) {
      toast.warn("Cannot place plant here - it overlaps with another element.");
      e.target.x(draggedPlant.x);
      e.target.y(draggedPlant.y);
      return;
    }

    if (!isWithinBounds) {
      toast.error("Cannot place plant outside the floor area.");
      e.target.x(draggedPlant.x);
      e.target.y(draggedPlant.y);
      return;
    }

    setElements((prev) =>
      prev.map((plant) =>
        plant.id === plantId
          ? { ...plant, x: newPosition.x, y: newPosition.y }
          : plant
      )
    );
  };

  // Fixed delete function to only delete specific element
  const deleteElement = (elementId) => {
    setElements((prev) => prev.filter((element) => element.id !== elementId));
    setSelectedId(null);
  };

  // Transformer for resizing bars and circles (update elements)
  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const selectedBar = bars.find((bar) => bar.id === selectedId);
    const selectedCircle = circles.find((circle) => circle.id === selectedId);
    const selectedDoor = doors.find((door) => door.id === selectedId);
    const selectedPlant = plants.find((plant) => plant.id === selectedId);

    if (selectedBar) {
      const newWidth = Math.max(50, selectedBar.width * scaleX);
      const newHeight = Math.max(30, selectedBar.height * scaleY);
      const newX = node.x();
      const newY = node.y();
      node.scaleX(1);
      node.scaleY(1);
      const transformedRect = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      const hasOverlap = [
        ...bars,
        ...tables,
        ...circles,
        ...doors,
        ...plants,
      ].some((element) => {
        if (element.id === selectedId) return false;
        const elementRect = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        };
        return checkOverlap(transformedRect, elementRect);
      });
      const isWithinBounds =
        newX >= 0 &&
        newY >= 0 &&
        newX + newWidth <= stageSize.width - 270 &&
        newY + newHeight <= stageSize.height;
      if (hasOverlap) {
        toast.warn(
          "Cannot resize bar - it would overlap with another element."
        );
        node.x(selectedBar.x);
        node.y(selectedBar.y);
        node.getStage().batchDraw();
        return;
      }
      if (!isWithinBounds) {
        toast.error("Cannot resize bar - it would go outside the floor area.");
        node.x(selectedBar.x);
        node.y(selectedBar.y);
        node.getStage().batchDraw();
        return;
      }
      setElements((prev) =>
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
    } else if (selectedCircle) {
      const newRadius = Math.max(
        20,
        selectedCircle.radius * Math.max(scaleX, scaleY)
      );
      const newX = node.x();
      const newY = node.y();
      node.scaleX(1);
      node.scaleY(1);
      const transformedCircle = {
        x: newX,
        y: newY,
        radius: newRadius,
      };
      const hasOverlap = [
        ...circles,
        ...tables,
        ...bars,
        ...doors,
        ...plants,
      ].some((element) => {
        if (element.id === selectedId) return false;
        if (element.type === "circle") {
          return checkCircleOverlap(transformedCircle, element);
        } else {
          // Check overlap with other element types using bounding boxes
          const elementRect = {
            x: element.x,
            y: element.y,
            width: element.width || 80,
            height: element.height || 80,
          };
          const circleRect = {
            x: newX - newRadius,
            y: newY - newRadius,
            width: newRadius * 2,
            height: newRadius * 2,
          };
          return checkOverlap(circleRect, elementRect);
        }
      });
      const isWithinBounds =
        newX - newRadius >= 0 &&
        newY - newRadius >= 0 &&
        newX + newRadius <= stageSize.width - 270 &&
        newY + newRadius <= stageSize.height;
      if (hasOverlap) {
        toast.warn(
          "Cannot resize circle - it would overlap with another element."
        );
        node.x(selectedCircle.x);
        node.y(selectedCircle.y);
        node.getStage().batchDraw();
        return;
      }
      if (!isWithinBounds) {
        toast.error(
          "Cannot resize circle - it would go outside the floor area."
        );
        node.x(selectedCircle.x);
        node.y(selectedCircle.y);
        node.getStage().batchDraw();
        return;
      }
      setElements((prev) =>
        prev.map((circle) =>
          circle.id === selectedId
            ? {
                ...circle,
                x: newX,
                y: newY,
                radius: newRadius,
              }
            : circle
        )
      );
    } else if (selectedDoor) {
      const newWidth = Math.max(30, selectedDoor.width * scaleX);
      const newHeight = Math.max(10, selectedDoor.height * scaleY);
      const newX = node.x();
      const newY = node.y();
      node.scaleX(1);
      node.scaleY(1);
      const transformedRect = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      const hasOverlap = [
        ...bars,
        ...tables,
        ...circles,
        ...doors,
        ...plants,
      ].some((element) => {
        if (element.id === selectedId) return false;
        const elementRect = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        };
        return checkOverlap(transformedRect, elementRect);
      });
      const isWithinBounds =
        newX >= 0 &&
        newY >= 0 &&
        newX + newWidth <= stageSize.width - 270 &&
        newY + newHeight <= stageSize.height;
      if (hasOverlap) {
        toast.warn(
          "Cannot resize door - it would overlap with another element."
        );
        node.x(selectedDoor.x);
        node.y(selectedDoor.y);
        node.getStage().batchDraw();
        return;
      }
      if (!isWithinBounds) {
        toast.error("Cannot resize door - it would go outside the floor area.");
        node.x(selectedDoor.x);
        node.y(selectedDoor.y);
        node.getStage().batchDraw();
        return;
      }
      setElements((prev) =>
        prev.map((door) =>
          door.id === selectedId
            ? {
                ...door,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              }
            : door
        )
      );
    } else if (selectedPlant) {
      const newWidth = Math.max(30, selectedPlant.width * scaleX);
      const newHeight = Math.max(30, selectedPlant.height * scaleY);
      const newX = node.x();
      const newY = node.y();
      node.scaleX(1);
      node.scaleY(1);
      const transformedRect = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      const hasOverlap = [
        ...bars,
        ...tables,
        ...circles,
        ...doors,
        ...plants,
      ].some((element) => {
        if (element.id === selectedId) return false;
        const elementRect = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        };
        return checkOverlap(transformedRect, elementRect);
      });
      const isWithinBounds =
        newX >= 0 &&
        newY >= 0 &&
        newX + newWidth <= stageSize.width - 270 &&
        newY + newHeight <= stageSize.height;
      if (hasOverlap) {
        toast.warn(
          "Cannot resize plant - it would overlap with another element."
        );
        node.x(selectedPlant.x);
        node.y(selectedPlant.y);
        node.getStage().batchDraw();
        return;
      }
      if (!isWithinBounds) {
        toast.error(
          "Cannot resize plant - it would go outside the floor area."
        );
        node.x(selectedPlant.x);
        node.y(selectedPlant.y);
        node.getStage().batchDraw();
        return;
      }
      setElements((prev) =>
        prev.map((plant) =>
          plant.id === selectedId
            ? {
                ...plant,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              }
            : plant
        )
      );
    }
  };

  // Expose drag functions to window for sidebar access
  useEffect(() => {
    window.setDraggedReservation = setDraggedReservation;
    return () => {
      delete window.setDraggedReservation;
    };
  }, []);

  // Console log elements with floor ID right above return
  console.log("Elements with floor ID:", {
    selectedFloor,
    totalElements: elements.length,
    elementsForCurrentFloor: {
      bars: bars.length,
      circles: circles.length,
      tables: tables.length,
      doors: doors.length,
      plants: plants.length,
    },
    allElements: elements.map((el) => ({
      id: el.id,
      type: el.type,
      floorId: el.floorId,
    })),
  });

  return (
    <div className={`flex h-screen relative`}>
      {/* Status filter dropdown */}
      <div className="absolute top-4 left-18 z-10 space-y-2">
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
                // Remove the last added bar if cancelled
                setElements((prev) => prev.slice(0, -1));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (barName.trim()) {
                  setElements((prevElements) =>
                    prevElements.map((element, index) =>
                      index === prevElements.length - 1 &&
                      element.type === "bar"
                        ? { ...element, text: barName.trim() }
                        : element
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

      <Dialog open={circleCreated} onOpenChange={setCircleCreated}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-semibold">
              Enter a name for the circle
            </DialogTitle>
          </DialogHeader>

          <Input
            value={circleName}
            onChange={(e) => setCircleName(e.target.value)}
            placeholder="Enter circle name"
            aria-label="Circle name"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCircleCreated(false);
                setCircleName("");
                // Remove the last added circle if cancelled
                setElements((prev) => prev.slice(0, -1));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (circleName.trim()) {
                  setElements((prevElements) =>
                    prevElements.map((element, index) =>
                      index === prevElements.length - 1 &&
                      element.type === "circle"
                        ? { ...element, text: circleName.trim() }
                        : element
                    )
                  );
                  setCircleCreated(false);
                  setCircleName("");
                }
              }}
              disabled={!circleName.trim()}
              aria-label="Submit circle name"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Stage Area */}
      <div
        className="flex-1 bg-white relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onMouseDown={
            drawingMode || circleDrawingMode ? handleStageMouseDown : undefined
          }
          onMouseMove={
            drawingMode || circleDrawingMode ? handleStageMouseMove : undefined
          }
          onMouseUp={
            drawingMode || circleDrawingMode ? handleStageMouseUp : undefined
          }
          onClick={(e) => {
            if (
              !drawingMode &&
              !circleDrawingMode &&
              e.target === e.target.getStage()
            ) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* Render doors */}
            {doors.map((door) => (
              <Group
                key={door.id}
                x={door.x}
                y={door.y}
                rotation={door.rotation || 0}
                draggable={userRole === "admin" && selectedId !== door.id}
                onClick={() => setSelectedId(door.id)}
                onDragEnd={(e) => handleDoorDragEnd(e, door.id)}
                ref={selectedId === door.id ? selectedDoorRef : null}
                onTransform={handleTransformEnd}
                className="relative"
              >
                {selectedId === door.id && (
                  <Html>
                    <Button
                      className="rounded-full bg-destructive size-6 text-white cursor-pointer -translate-x-1/2"
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -25,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(door.id);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </Html>
                )}
                {doorImg ? (
                  <Image
                    image={doorImg}
                    width={door.width}
                    height={door.height}
                    stroke={selectedId === door.id ? "#2563eb" : "#4b5563"}
                    strokeWidth={selectedId === door.id ? 3 : 2}
                  />
                ) : (
                  <Rect
                    width={door.width}
                    height={door.height}
                    fill="#8B4513"
                    stroke={selectedId === door.id ? "#2563eb" : "#4b5563"}
                    strokeWidth={selectedId === door.id ? 3 : 2}
                  />
                )}
                <Text
                  x={door.width / 2}
                  y={door.height / 2}
                  text="Door"
                  fontSize={12}
                  fill="#ffffff"
                  align="center"
                  verticalAlign="middle"
                  offsetX={door.width / 4}
                  offsetY={6}
                />
              </Group>
            ))}

            {/* Render plants */}
            {plants.map((plant) => (
              <Group
                key={plant.id}
                x={plant.x}
                y={plant.y}
                draggable={userRole === "admin" && selectedId !== plant.id}
                onClick={() => setSelectedId(plant.id)}
                onDragEnd={(e) => handlePlantDragEnd(e, plant.id)}
                ref={selectedId === plant.id ? selectedPlantRef : null}
                onTransform={handleTransformEnd}
                className="relative"
              >
                {selectedId === plant.id && (
                  <Html>
                    <Button
                      className="rounded-full bg-destructive size-6 text-white cursor-pointer -translate-x-1/2"
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -25,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(plant.id);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </Html>
                )}
                {plantImg ? (
                  <Image
                    image={plantImg}
                    width={plant.width}
                    height={plant.height}
                    stroke={selectedId === plant.id ? "#2563eb" : "#4b5563"}
                    strokeWidth={selectedId === plant.id ? 3 : 2}
                  />
                ) : (
                  <Circle
                    x={plant.width / 2}
                    y={plant.height / 2}
                    radius={Math.min(plant.width, plant.height) / 2}
                    fill="#22c55e"
                    stroke={selectedId === plant.id ? "#2563eb" : "#4b5563"}
                    strokeWidth={selectedId === plant.id ? 3 : 2}
                  />
                )}
                <Text
                  x={plant.width / 2}
                  y={plant.height / 2}
                  text="Plant"
                  fontSize={12}
                  fill="#ffffff"
                  align="center"
                  verticalAlign="middle"
                  offsetX={plant.width / 4}
                  offsetY={6}
                />
              </Group>
            ))}

            {/* Render drawn rectangles (bars) */}
            {bars.map((rect) => (
              <Group
                key={rect.id}
                x={rect.x}
                y={rect.y}
                draggable={userRole === "admin" && selectedId !== rect.id}
                onClick={() => setSelectedId(rect.id)}
                onDragEnd={(e) => handleBarDragEnd(e, rect.id)}
                ref={selectedId === rect.id ? selectedBarRef : null}
                onTransform={handleTransformEnd}
                className="relative"
              >
                {selectedId === rect.id && (
                  <Html>
                    <Button
                      className="rounded-full bg-destructive size-6 text-white cursor-pointer -translate-x-1/2"
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -25,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(rect.id);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </Html>
                )}
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

            {/* Render drawn circles */}
            {circles.map((circle) => (
              <Group
                key={circle.id}
                x={circle.x}
                y={circle.y}
                draggable={userRole === "admin" && selectedId !== circle.id}
                onClick={() => setSelectedId(circle.id)}
                onDragEnd={(e) => handleCircleDragEnd(e, circle.id)}
                ref={selectedId === circle.id ? selectedCircleRef : null}
                onTransform={handleTransformEnd}
                className="relative"
              >
                {selectedId === circle.id && (
                  <Html>
                    <Button
                      className="rounded-full bg-destructive size-6 text-white cursor-pointer -translate-x-1/2"
                      style={{
                        position: "absolute",
                        top: -circle.radius - 12,
                        right: -25,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(circle.id);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </Html>
                )}
                <Circle
                  radius={circle.radius}
                  fill="#f3f4f9"
                  stroke={selectedId === circle.id ? "#2563eb" : "#4b5563"}
                  strokeWidth={selectedId === circle.id ? 3 : 2}
                />
                <Text
                  x={0}
                  y={0}
                  text={circle.text}
                  fontSize={16}
                  fill="#4b5563"
                  align="center"
                  verticalAlign="middle"
                  offsetX={0}
                  offsetY={8}
                />
              </Group>
            ))}

            {/* Render current drawing rectangle */}
            {currentRect && isDrawing && drawingMode && (
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

            {/* Render current drawing circle */}
            {currentCircle && isDrawing && circleDrawingMode && (
              <Circle
                x={currentCircle.x}
                y={currentCircle.y}
                radius={currentCircle.radius}
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

            {/* Transformer for selected elements */}
            {userRole === "admin" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit minimum size
                  if (newBox.width < 30 || newBox.height < 30) {
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
                rotateEnabled={false}
                borderStroke="#2563eb"
                borderStrokeWidth={2}
                anchorFill="#2563eb"
                anchorStroke="#1d4ed8"
                anchorSize={8}
              />
            )}
          </Layer>
          <Layer name="top-layer" />
        </Stage>

        {/* Instructions overlay */}
        {tables.length === 0 &&
          bars.length === 0 &&
          circles.length === 0 &&
          doors.length === 0 &&
          plants.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  Restaurant Floor Plan
                </h3>
                <p className="text-lg">
                  {userRole === "admin"
                    ? "Drag elements from the sidebar to start designing your layout"
                    : "Floor plan ready for reservations"}
                </p>
              </div>
            </div>
          )}

        {/* Drawing mode indicator */}
        {(drawingMode || circleDrawingMode) && (
          <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">
              🎨 {drawingMode ? "Bar Drawing" : "Circle Drawing"} Mode Active
            </p>
            <p className="text-xs">
              Click and drag to draw {drawingMode ? "bars" : "circles"}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => {
                if (drawingMode && setDrawingMode) {
                  setDrawingMode(false);
                }
                if (circleDrawingMode && setCircleDrawingMode) {
                  setCircleDrawingMode(false);
                }
                setIsDrawing(false);
                setDrawStart(null);
                setCurrentRect(null);
                setCurrentCircle(null);
              }}
            >
              Exit Drawing Mode
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorCanvas;
