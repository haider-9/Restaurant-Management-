import { nanoid } from "nanoid";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

const FloorManagementContext = createContext();

export const useFloorManagement = () => {
  const context = useContext(FloorManagementContext);
  if (!context) {
    throw new Error(
      "useFloorManagement must be used within a FloorManagementProvider"
    );
  }
  return context;
};

export const FloorManagementProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userRole, setUserRole] = useState("admin"); // Default to admin
  const [drawingMode, setDrawingMode] = useState(false); // Add drawing mode state

  const [drawnRectangles, setDrawnRectangles] = useState([]); // Add drawn rectangles state
  const [barCreated, setBarCreated] = useState(false);
  const [barName, setBarName] = useState("");

  const stageRef = useRef();
  const dragUrl = useRef();

  // Table types with SVG paths
  const tableTypes = [
    {
      id: "table-1-seater",
      name: "1 Seater Table",
      seats: 1,
      width: 60,
      height: 60,
      svgPath: "/Tables/1seater.svg",
      type: "table",
    },
    {
      id: "table-4-seater",
      name: "4 Seater Table",
      seats: 4,
      width: 100,
      height: 100,
      svgPath: "/Tables/4seater.svg",
      type: "table",
    },
    {
      id: "table-6-seater",
      name: "6 Seater Table",
      seats: 6,
      width: 120,
      height: 120,
      svgPath: "/Tables/6seater.svg",
      type: "table",
    },
    {
      id: "table-8-seater",
      name: "8 Seater Table",
      seats: 8,
      width: 140,
      height: 140,
      svgPath: "/Tables/8seater.svg",
      type: "table",
    },
  ];

  const tableStatuses = [
    { id: "available", name: "Available", color: "#10b981" },
    { id: "occupied", name: "Occupied", color: "#ef4444" },
    { id: "reserved", name: "Reserved", color: "#f59e0b" },
  ];

  // Generate unique table number
  const generateTableNumber = () => {
    const existingNumbers = tables.map((table) => table.tableNumber);
    let number = 1;
    while (existingNumbers.includes(number)) {
      number++;
    }
    return number;
  };

  // Add table to floor
  const addElement = (element, position) => {
    if (userRole !== "admin") return;

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

      setTables((prev) => [...prev, newElement]);
      setElements([...elements, newElement]);
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

    setTables((prev) => [...prev, newTable]);
    setElements(...elements, newTable);
  };

  // Add drawn rectangle
  const addDrawnRectangle = (rectangle) => {
    if (userRole !== "admin") return;

    setBarCreated(true);
    const newRectangle = {
      id: `bar-${nanoid()}`,
      x: rectangle.x,
      y: rectangle.y,
      width: rectangle.width,
      height: rectangle.height,
      text: barName || "Bar",
      type: "bar",
      createdAt: new Date(),
    };

    setDrawnRectangles((prev) => [...prev, newRectangle]);
    setDrawingMode(false);
  };

  // Delete selected table
  const deleteTable = () => {
    if (userRole !== "admin" || !selectedId) return;

    setTables((prev) => prev.filter((table) => table.id !== selectedId));
    setDrawnRectangles((prev) => prev.filter((rect) => rect.id !== selectedId));
    setSelectedId(null);
  };

  // Clear all tables
  const clearAllTables = () => {
    if (userRole !== "admin") return;

    setTables([]);
    setDrawnRectangles([]);
    setSelectedId(null);
  };

  // Duplicate selected table
  const duplicateTable = () => {
    if (userRole !== "admin" || !selectedId) return;

    const selectedTable = tables.find((table) => table.id === selectedId);
    if (!selectedTable || selectedTable.type !== "table") return;

    const newTable = {
      ...selectedTable,
      id: `table-${nanoid()}`,
      tableNumber: generateTableNumber(),
      x: selectedTable.x + 20,
      y: selectedTable.y + 20,
      createdAt: new Date(),
      status: "available",
      color: tableStatuses.find((status) => status.id === "available").color,
      reservationTime: null,
    };

    setTables((prev) => [...prev, newTable]);
  };
  const updateBarDimensions = (barId, dimensions) => {
    if (userRole !== "admin") return;

    setDrawnRectangles((prev) =>
      prev.map((bar) => (bar.id === barId ? { ...bar, ...dimensions } : bar))
    );
  };

  // Change table status
  const changeTableStatus = (status) => {
    if (!selectedId) return;

    const statusColor = tableStatuses.find((s) => s.id === status)?.color;

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedId && table.type === "table"
          ? {
              ...table,
              status,
              color: statusColor,
              reservationTime:
                status !== "reserved" ? null : table.reservationTime,
            }
          : table
      )
    );
  };

  // Set reservation name
  const setReservationName = (tableId, name) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId && table.type === "table"
          ? { ...table, reservationName: name }
          : table
      )
    );
  };

  // Set reservation time
  const setReservationTime = (time) => {
    if (!selectedId) return;

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedId && table.type === "table"
          ? { ...table, reservationTime: time }
          : table
      )
    );
  };

  // Update table position
  const updateTablePosition = (tableId, position) => {
    if (userRole !== "admin") return;

    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...table, x: position.x, y: position.y }
          : table
      )
    );

    setDrawnRectangles((prev) =>
      prev.map((rect) =>
        rect.id === tableId ? { ...rect, x: position.x, y: position.y } : rect
      )
    );
  };

  // Get selected table
  const getSelectedTable = () => {
    return tables.find((table) => table.id === selectedId) || null;
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
    const savedTables = localStorage.getItem("floorManagement-tables");
    const savedRole = localStorage.getItem("floorManagement-userRole");
    const savedRectangles = localStorage.getItem("floorManagement-rectangles");

    if (savedTables) {
      try {
        const parsedTables = JSON.parse(savedTables);
        setTables(
          parsedTables.map((table) => ({
            ...table,
            createdAt: new Date(table.createdAt),
            reservationTime: table.reservationTime
              ? new Date(table.reservationTime)
              : null,
          }))
        );
      } catch (error) {
        console.error("Error loading saved tables:", error);
      }
    }

    if (savedRectangles) {
      try {
        const parsedRectangles = JSON.parse(savedRectangles);
        setDrawnRectangles(
          parsedRectangles.map((rect) => ({
            ...rect,
            createdAt: new Date(rect.createdAt),
          }))
        );
      } catch (error) {
        console.error("Error loading saved rectangles:", error);
      }
    }

    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Save data when tables or role changes
  useEffect(() => {
    localStorage.setItem("floorManagement-tables", JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(
      "floorManagement-rectangles",
      JSON.stringify(drawnRectangles)
    );
  }, [drawnRectangles]);

  useEffect(() => {
    localStorage.setItem("floorManagement-userRole", userRole);
  }, [userRole]);

  const transferReservation = (fromTableId, toTableId) => {
    setTables((prevTables) => {
      return prevTables.map((table) => {
        if (table.id === fromTableId && table.type === "table") {
          // Clear the original table
          return {
            ...table,
            status: "available",
            reservationName: "",
            reservationTime: null,
            color: tableStatuses.find((status) => status.id === "available")
              .color,
          };
        } else if (table.id === toTableId && table.type === "table") {
          // Get the reservation data from the original table
          const originalTable = prevTables.find((t) => t.id === fromTableId);
          return {
            ...table,
            status: "reserved",
            reservationName: originalTable?.reservationName || "",
            reservationTime: originalTable?.reservationTime || null,
            color: tableStatuses.find((status) => status.id === "reserved")
              .color,
          };
        }
        return table;
      });
    });
  };

  const value = {
    tables,
    selectedId,
    sidebarVisible,
    tableTypes,
    tableStatuses,
    userRole,
    drawingMode,
    drawnRectangles,
    stageRef,
    dragUrl,
    barCreated,
    barName,
    setBarName,
    setBarCreated,
    setTables,
    setDrawnRectangles,
    setSelectedId,
    setSidebarVisible,
    setUserRole,
    setDrawingMode,
    addElement,
    addDrawnRectangle,
    deleteTable,
    clearAllTables,
    duplicateTable,
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
