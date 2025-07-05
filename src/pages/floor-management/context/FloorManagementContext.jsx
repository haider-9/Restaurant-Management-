import { nanoid } from "nanoid";
import { createContext, useState, useRef, useEffect } from "react";
import { tableStatuses } from "../constants";

export const FloorManagementContext = createContext();

export const FloorManagementProvider = ({ children }) => {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userRole, setUserRole] = useState("admin"); // Default to admin
  const [drawingMode, setDrawingMode] = useState(false); // Add drawing mode state

  const [barCreated, setBarCreated] = useState(false);
  const [barName, setBarName] = useState("");
  // Add these to your useFloorManagement hook
  const [circleDrawingMode, setCircleDrawingMode] = useState(false);
  const [circleCreated, setCircleCreated] = useState(false);
  const [circleName, setCircleName] = useState("");

  const stageRef = useRef();
  const dragUrl = useRef();

  // Generate unique table number
  const generateTableNumber = () => {
    const existingNumbers = elements
      .filter((e) => e.type === "table")
      .map((table) => table.tableNumber);
    let number = 1;
    while (existingNumbers.includes(number)) {
      number++;
    }
    return number;
  };

  // Add table to floor
  const addElement = (element, position) => {
    if (userRole !== "admin") return;

    if (element.type === "bar") {
      const newElement = {
        id: `bar-${nanoid()}`,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        text: barName || "Bar",
        type: "bar",
        createdAt: new Date(),
      };
      setElements((prev) => [...prev, newElement]);
      setBarCreated(true);
      return;
    }
    // Handle door objects (non-table elements)
    if (element.type !== "table") {
      const newElement = {
        id: `element-${nanoid()}`,
        x: position.x,
        y: position.y,
        width: element.width,
        height: element.height,
        type: element.type,
        svgPath: element.path,
        name: element.name,
        createdAt: new Date(),
      };
      setElements((prev) => [...prev, newElement]);
      return;
    }
    // Handle table objects
    const newTable = {
      id: `table-${nanoid()}`,
      tableNumber: generateTableNumber(),
      x: position.x,
      y: position.y,
      width: element.width,
      height: element.height,
      seats: element.seats,
      status: "available",
      color: tableStatuses.find((status) => status.id === "available").color,
      createdAt: new Date(),
      reservationName: null,
      reservationTime: null,
      svgPath: element.svgPath,
      type: "table",
    };
    setElements((prev) => [...prev, newTable]);
  };

  const updateBarDimensions = (barId, dimensions) => {
    if (userRole !== "admin") return;

    setElements((prev) =>
      prev.map((element) =>
        element.type === "bar" && element.id === barId
          ? { ...element, ...dimensions }
          : element
      )
    );
  };

  const changeTableStatus = (status) => {
    if (!selectedId) return;
    const statusColor = tableStatuses.find((s) => s.id === status)?.color;
    setElements((prev) =>
      prev.map((element) =>
        element.id === selectedId && element.type === "table"
          ? {
              ...element,
              status,
              color: statusColor,
              reservationTime:
                status !== "reserved" ? null : element.reservationTime,
            }
          : element
      )
    );
  };

  const setReservationName = (tableId, name) => {
    setElements((prev) =>
      prev.map((element) =>
        element.id === tableId && element.type === "table"
          ? { ...element, reservationName: name }
          : element
      )
    );
  };

  const setReservationTime = (time) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((element) =>
        element.id === selectedId && element.type === "table"
          ? { ...element, reservationTime: time }
          : element
      )
    );
  };

  // Update table position
  const updateTablePosition = (tableId, position) => {
    if (userRole !== "admin") return;
    setElements((prev) =>
      prev.map((element) =>
        element.id === tableId
          ? { ...element, x: position.x, y: position.y }
          : element
      )
    );
  };

  // Get selected table
  const getSelectedTable = () => {
    return (
      elements.find(
        (element) => element.id === selectedId && element.type === "table"
      ) || null
    );
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Load saved data on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("USER_ROLE");
    const savedElements = localStorage.getItem("elements");

    if (savedRole) {
      setUserRole(savedRole);
    }

    if (savedElements) {
      try {
        const parsedElements = JSON.parse(savedElements);
        setElements(parsedElements);
      } catch (error) {
        console.error("Error loading saved elements:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("elements", JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    localStorage.setItem("USER_ROLE", userRole);
  }, [userRole]);

  const transferReservation = (fromTableId, toTableId) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id === fromTableId && element.type === "table") {
          // Clear the original table
          return {
            ...element,
            status: "available",
            reservationName: "",
            reservationTime: null,
            color: tableStatuses.find((status) => status.id === "available")
              .color,
          };
        } else if (element.id === toTableId && element.type === "table") {
          // Get the reservation data from the original table
          const originalTable = prev.find((t) => t.id === fromTableId);
          return {
            ...element,
            status: "reserved",
            reservationName: originalTable?.reservationName || "",
            reservationTime: originalTable?.reservationTime || null,
            color: tableStatuses.find((status) => status.id === "reserved")
              .color,
          };
        }
        return element;
      })
    );
  };

  const value = {
    elements,
    barName,
    selectedId,
    sidebarVisible,
    userRole,
    drawingMode,
    stageRef,
    dragUrl,
    barCreated,
    circleDrawingMode,
    setCircleDrawingMode,
    circleCreated,
    setCircleCreated,
    circleName,
    setCircleName,
    setElements,
    setBarName,
    setBarCreated,
    setSelectedId,
    setSidebarVisible,
    setUserRole,
    setDrawingMode,
    addElement,
    changeTableStatus,
    setReservationTime,
    setReservationName,
    updateTablePosition,
    getSelectedTable,
    toggleSidebar,
    updateBarDimensions,
    formatTime,
    formatDate,
    transferReservation,
  };

  return (
    <FloorManagementContext.Provider value={value}>
      {children}
    </FloorManagementContext.Provider>
  );
};
