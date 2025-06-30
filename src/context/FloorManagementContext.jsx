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
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userRole, setUserRole] = useState("admin"); // Default to admin
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
    },
    {
      id: "table-4-seater",
      name: "4 Seater Table",
      seats: 4,
      width: 100,
      height: 100,
      svgPath: "/Tables/4seater.svg",
    },
    {
      id: "table-6-seater",
      name: "6 Seater Table",
      seats: 6,
      width: 120,
      height: 120,
      svgPath: "/Tables/6seater.svg",
    },
    {
      id: "table-8-seater",
      name: "8 Seater Table",
      seats: 8,
      width: 140,
      height: 140,
      svgPath: "/Tables/8seater.svg",
    },
  ];

  const tableStatuses = [
    { id: "free", name: "Free", color: "#10b981" },
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
  const addTable = (tableType, position) => {
    if (userRole !== "admin") return;

    const newTable = {
      id: `table-${Date.now()}-${Math.random()}`,
      tableNumber: generateTableNumber(),
      x: position.x,
      y: position.y,
      width: tableType.width,
      height: tableType.height,
      seats: tableType.seats,
      status: "free",
      color: tableStatuses.find((status) => status.id === "free").color,
      createdAt: new Date(),
      reservationTime: null,
      svgPath: tableType.svgPath,
    };

    setTables((prev) => [...prev, newTable]);
  };

  // Delete selected table
  const deleteTable = () => {
    if (userRole !== "admin" || !selectedId) return;

    setTables((prev) => prev.filter((table) => table.id !== selectedId));
    setSelectedId(null);
  };

  // Clear all tables
  const clearAllTables = () => {
    if (userRole !== "admin") return;

    setTables([]);
    setSelectedId(null);
  };

  // Duplicate selected table
  const duplicateTable = () => {
    if (userRole !== "admin" || !selectedId) return;

    const selectedTable = tables.find((table) => table.id === selectedId);
    if (!selectedTable) return;

    const newTable = {
      ...selectedTable,
      id: `table-${Date.now()}-${Math.random()}`,
      tableNumber: generateTableNumber(),
      x: selectedTable.x + 20,
      y: selectedTable.y + 20,
      createdAt: new Date(),
      status: "free",
      color: tableStatuses.find((status) => status.id === "free").color,
      reservationTime: null,
    };

    setTables((prev) => [...prev, newTable]);
  };

  // Change table status
  const changeTableStatus = (status) => {
    if (!selectedId) return;

    const statusColor = tableStatuses.find((s) => s.id === status)?.color;

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedId
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

  // Set reservation time
  const setReservationTime = (time) => {
    if (!selectedId) return;

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedId ? { ...table, reservationTime: time } : table
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
  };

  // Get selected table
  const getSelectedTable = () => {
    return tables.find((table) => table.id === selectedId) || null;
  };

  // Get sorted tables based on filter
  const getSortedTables = () => {
    if (statusFilter === "all") return tables;
    return tables.filter((table) => table.status === statusFilter);
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

    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Save data when tables or role changes
  useEffect(() => {
    localStorage.setItem("floorManagement-tables", JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem("floorManagement-userRole", userRole);
  }, [userRole]);

  const transferReservation = (fromTableId, toTableId) => {
    setTables((prevTables) => {
      return prevTables.map((table) => {
        if (table.id === fromTableId) {
          // Clear the original table
          return {
            ...table,
            status: "free",
            reservationName: "",
            reservationTime: null,
          };
        } else if (table.id === toTableId) {
          // Get the reservation data from the original table
          const originalTable = prevTables.find((t) => t.id === fromTableId);
          return {
            ...table,
            status: "reserved",
            reservationName: originalTable?.reservationName || "",
            reservationTime: originalTable?.reservationTime || null,
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
    statusFilter,
    userRole,
    stageRef,
    dragUrl,
    setTables,
    setSelectedId,
    setSidebarVisible,
    setStatusFilter,
    setUserRole,
    addTable,
    deleteTable,
    clearAllTables,
    duplicateTable,
    changeTableStatus,
    setReservationTime,
    updateTablePosition,
    getSelectedTable,
    getSortedTables,
    toggleSidebar,
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
