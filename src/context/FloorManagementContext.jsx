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
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const stageRef = useRef();
  const dragUrl = useRef();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Table configurations with different seat counts
  const tableTypes = [
    { id: "8-seater", seats: 8, width: 120, height: 80, name: "8 Seater" },
    { id: "6-seater", seats: 6, width: 100, height: 70, name: "6 Seater" },
    { id: "4-seater", seats: 4, width: 80, height: 60, name: "4 Seater" },
    { id: "2-seater", seats: 2, width: 60, height: 50, name: "2 Seater" },
  ];

  // Table status options with specific colors
  const tableStatuses = [
    { id: "free", name: "Free", color: "#4CAF50" },
    { id: "occupied", name: "Occupied", color: "#2196F3" },
    { id: "reserved", name: "Reserved", color: "#9E9E9E" },
  ];

  // Check if position overlaps with existing tables
  const checkOverlap = (newTable, existingTables, margin = 60) => {
    return existingTables.some((table) => {
      if (table.id === newTable.id) return false;

      const dx = Math.abs(newTable.x - table.x);
      const dy = Math.abs(newTable.y - table.y);

      const minDistanceX = (newTable.width + table.width) / 2 + margin;
      const minDistanceY = (newTable.height + table.height) / 2 + margin;

      return dx < minDistanceX && dy < minDistanceY;
    });
  };

  // Find valid position without overlap
  const findValidPosition = (newTable, existingTables) => {
    if (!checkOverlap(newTable, existingTables)) {
      return { x: newTable.x, y: newTable.y };
    }

    const originalX = newTable.x;
    const originalY = newTable.y;

    const spiralSearch = (centerX, centerY, maxDistance = 300) => {
      for (let distance = 30; distance <= maxDistance; distance += 15) {
        for (let angle = 0; angle < 360; angle += 30) {
          const radian = (angle * Math.PI) / 180;
          const x = centerX + Math.cos(radian) * distance;
          const y = centerY + Math.sin(radian) * distance;

          const testTable = { ...newTable, x, y };
          if (!checkOverlap(testTable, existingTables)) {
            return { x, y };
          }
        }
      }

      const nearestTable = findNearestTable(centerX, centerY, existingTables);
      if (nearestTable) {
        const positions = [
          { x: nearestTable.x + nearestTable.width + 60, y: nearestTable.y },
          { x: nearestTable.x, y: nearestTable.y + nearestTable.height + 60 },
          { x: nearestTable.x - newTable.width - 60, y: nearestTable.y },
          { x: nearestTable.x, y: nearestTable.y - newTable.height - 60 },
        ];

        for (const pos of positions) {
          const testTable = { ...newTable, ...pos };
          if (!checkOverlap(testTable, existingTables)) {
            return pos;
          }
        }
      }

      return { x: Math.random() * 500, y: Math.random() * 500 };
    };

    const findNearestTable = (x, y, tables) => {
      if (tables.length === 0) return null;

      return tables.reduce((nearest, table) => {
        const dx = table.x - x;
        const dy = table.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!nearest || distance < nearest.distance) {
          return { ...table, distance };
        }
        return nearest;
      }, null);
    };

    return spiralSearch(originalX, originalY);
  };

  // Table management functions
  const addTable = (tableType, position) => {
    const statusColor = tableStatuses.find((s) => s.id === "free").color;

    const newTable = {
      ...tableType,
      x: position.x,
      y: position.y,
      id: `table-${nanoid()}}`,
      tableNumber: tables.length + 1,
      status: "free",
      color: statusColor,
      reservationTime: null,
      createdAt: new Date().toISOString(),
    };

    const validPosition = findValidPosition(newTable, tables);
    const finalTable = { ...newTable, ...validPosition };

    setTables([...tables, finalTable]);
  };

  const updateTablePosition = (tableId, newPosition) => {
    const newTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedTable = { ...table, ...newPosition };
        const validPosition = findValidPosition(
          updatedTable,
          tables.filter((t) => t.id !== tableId)
        );
        return { ...updatedTable, ...validPosition };
      }
      return table;
    });

    setTables(newTables);
  };

  const deleteTable = () => {
    if (selectedId) {
      setTables(tables.filter((table) => table.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearAllTables = () => {
    setTables([]);
    setSelectedId(null);
  };

  const changeTableStatus = (newStatus) => {
    if (selectedId) {
      const statusColor = tableStatuses.find((s) => s.id === newStatus).color;

      setTables(
        tables.map((table) =>
          table.id === selectedId
            ? {
                ...table,
                status: newStatus,
                color: statusColor,
                reservationTime:
                  newStatus === "reserved"
                    ? new Date().toISOString()
                    : table.reservationTime,
              }
            : table
        )
      );
    }
  };

  const setReservationTime = (time) => {
    if (selectedId) {
      setTables(
        tables.map((table) =>
          table.id === selectedId ? { ...table, reservationTime: time } : table
        )
      );
    }
  };

  const duplicateTable = () => {
    if (selectedId) {
      const tableToClone = tables.find((table) => table.id === selectedId);
      if (tableToClone) {
        const newTable = {
          ...tableToClone,
          id: `table-${Date.now()}-${Math.random()}`,
          tableNumber: tables.length + 1,
          x: tableToClone.x + 50,
          y: tableToClone.y + 50,
          createdAt: new Date().toISOString(),
        };

        const validPosition = findValidPosition(newTable, tables);
        const finalTable = { ...newTable, ...validPosition };

        setTables([...tables, finalTable]);
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Utility functions
  const formatTime = (isoString) => {
    if (!isoString) return "Not set";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const getFilteredTables = () => {
    return tables.filter((table) => {
      if (statusFilter === "all") return true;
      return table.status === statusFilter;
    });
  };

  const getSortedTables = () => {
    const filteredTables = getFilteredTables();
    return [...filteredTables].sort((a, b) => {
      if (a.reservationTime && !b.reservationTime) return -1;
      if (!a.reservationTime && b.reservationTime) return 1;

      if (a.reservationTime && b.reservationTime) {
        return new Date(a.reservationTime) - new Date(b.reservationTime);
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  const getSelectedTable = () => {
    return tables.find((table) => table.id === selectedId);
  };

  const value = {
    // State
    tables,
    selectedId,
    sidebarVisible,
    currentTime,
    statusFilter,
    stageRef,
    dragUrl,
    tableTypes,
    tableStatuses,

    // Setters
    setSelectedId,
    setTables,
    setStatusFilter,

    // Functions
    addTable,
    updateTablePosition,
    deleteTable,
    clearAllTables,
    checkOverlap,
    changeTableStatus,
    setReservationTime,
    duplicateTable,
    toggleSidebar,
    formatTime,
    formatDate,
    getFilteredTables,
    getSortedTables,
    getSelectedTable,
  };

  return (
    <FloorManagementContext.Provider value={value}>
      {children}
    </FloorManagementContext.Provider>
  );
};
