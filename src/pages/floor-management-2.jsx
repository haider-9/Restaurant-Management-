import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Text, Circle, Line } from 'react-konva';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FloorManagement = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zones, setZones] = useState([
    { id: 'zone-1', name: 'Main Dining', color: 'rgba(33, 150, 243, 0.1)', tables: [] },
    { id: 'zone-2', name: 'Bar Area', color: 'rgba(156, 39, 176, 0.1)', tables: [] },
    { id: 'zone-3', name: 'Outdoor Patio', color: 'rgba(76, 175, 80, 0.1)', tables: [] },
  ]);
  const [activeZone, setActiveZone] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [newZone, setNewZone] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'service', 'reservation'
  const [reservations, setReservations] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const stageRef = useRef();
  const dragUrl = useRef();
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // Table configurations with different seat counts and more colors
  const tableTypes = [
    { id: '8-seater', seats: 8, width: 120, height: 80, color: '#E91E63', name: '8 Seater', shape: 'rectangle' },
    { id: '6-seater', seats: 6, width: 100, height: 70, color: '#9C27B0', name: '6 Seater', shape: 'rectangle' },
    { id: '4-seater', seats: 4, width: 80, height: 60, color: '#FF5722', name: '4 Seater', shape: 'rectangle' },
    { id: '4-seater-round', seats: 4, width: 70, height: 70, color: '#2196F3', name: '4 Seater Round', shape: 'circle' },
    { id: '2-seater', seats: 2, width: 60, height: 50, color: '#795548', name: '2 Seater', shape: 'rectangle' }
  ];

  // Table status options
  const tableStatuses = [
    { id: 'available', name: 'Available', color: '#4CAF50' },
    { id: 'occupied', name: 'Occupied', color: '#F44336' },
    { id: 'reserved', name: 'Reserved', color: '#FFC107' },
    { id: 'maintenance', name: 'Maintenance', color: '#607D8B' },
    { id: 'cleaning', name: 'Cleaning', color: '#00BCD4' }
  ];

  // Additional color variations for tables
  const colorVariations = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#607D8B', '#F44336', '#9E9E9E', '#FF6F00'
  ];

  // Save state to undo stack
  const saveToHistory = (newTables) => {
    setUndoStack([...undoStack, tables]);
    setRedoStack([]);
  };

  // Undo last action
  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack([...redoStack, tables]);
      setTables(previousState);
      setUndoStack(undoStack.slice(0, -1));
      toast.info("Undo successful");
    } else {
      toast.warning("Nothing to undo");
    }
  };

  // Redo last undone action
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack([...undoStack, tables]);
      setTables(nextState);
      setRedoStack(redoStack.slice(0, -1));
      toast.info("Redo successful");
    } else {
      toast.warning("Nothing to redo");
    }
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if position overlaps with existing tables (increased margin)
  const checkOverlap = (newTable, existingTables, margin = 60) => {
    return existingTables.some(table => {
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
    // If no overlap, keep the original position
    if (!checkOverlap(newTable, existingTables)) {
      return { x: newTable.x, y: newTable.y };
    }

    // Find the closest non-overlapping position
    const originalX = newTable.x;
    const originalY = newTable.y;

    // Try positions in a spiral pattern around the original position
    const spiralSearch = (centerX, centerY, maxDistance = 300) => {
      // Start with small steps and increase
      for (let distance = 30; distance <= maxDistance; distance += 15) {
        // Try positions in a circle at current distance
        for (let angle = 0; angle < 360; angle += 30) {
          const radian = angle * Math.PI / 180;
          const x = centerX + Math.cos(radian) * distance;
          const y = centerY + Math.sin(radian) * distance;

          const testTable = { ...newTable, x, y };
          if (!checkOverlap(testTable, existingTables)) {
            return { x, y };
          }
        }
      }

      // If no position found, try placing it adjacent to the nearest table
      const nearestTable = findNearestTable(centerX, centerY, existingTables);
      if (nearestTable) {
        // Try positions to the right, below, left, and above the nearest table
        const positions = [
          { x: nearestTable.x + nearestTable.width + 60, y: nearestTable.y },
          { x: nearestTable.x, y: nearestTable.y + nearestTable.height + 60 },
          { x: nearestTable.x - newTable.width - 60, y: nearestTable.y },
          { x: nearestTable.x, y: nearestTable.y - newTable.height - 60 }
        ];

        for (const pos of positions) {
          const testTable = { ...newTable, ...pos };
          if (!checkOverlap(testTable, existingTables)) {
            return pos;
          }
        }
      }

      // Last resort: return a position far from other tables
      return { x: Math.random() * 500, y: Math.random() * 500 };
    };

    // Find the nearest table to a point
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

  // Handle drag start from sidebar
  const handleDragStart = (e, tableType) => {
    dragUrl.current = tableType;
  };

  // Handle drag over stage
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on stage
  const handleDrop = (e) => {
    e.preventDefault();

    if (!dragUrl.current) return;

    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    // Use actual stage transform for correct placement
    const stagePos = stage.position();
    const stageScale = stage.scale();
    const x = (pointerPosition.x - stagePos.x) / stageScale.x;
    const y = (pointerPosition.y - stagePos.y) / stageScale.y;

    // Assign random color variation
    const randomColor = colorVariations[Math.floor(Math.random() * colorVariations.length)];

    const newTable = {
      ...dragUrl.current,
      x,
      y,
      id: `table-${Date.now()}-${Math.random()}`,
      tableNumber: tables.length + 1,
      color: randomColor,
      status: 'available',
      zoneId: activeZone || null,
      rotation: 0,
      createdAt: new Date().toISOString()
    };

    const validPosition = findValidPosition(newTable, tables);
    const finalTable = { ...newTable, ...validPosition };

    saveToHistory(tables);
    setTables([...tables, finalTable]);
    dragUrl.current = null;
    
    // Animation effect
    toast.success(`Table ${finalTable.tableNumber} added`);
  };

  // Handle table drag on stage
  const handleTableDragEnd = (e, tableId) => {
    saveToHistory(tables);
    
    const newTables = tables.map(table => {
      if (table.id === tableId) {
        const updatedTable = {
          ...table,
          x: e.target.x(),
          y: e.target.y()
        };

        const validPosition = findValidPosition(updatedTable, tables.filter(t => t.id !== tableId));
        return { ...updatedTable, ...validPosition };
      }
      return table;
    });

    setTables(newTables);
  };

  // Delete selected table
  const deleteTable = () => {
    if (selectedId) {
      saveToHistory(tables);
      const tableToDelete = tables.find(table => table.id === selectedId);
      setTables(tables.filter(table => table.id !== selectedId));
      setSelectedId(null);
      toast.error(`Table ${tableToDelete.tableNumber} deleted`);
    }
  };

  // Clear all tables
  const clearAllTables = () => {
    if (tables.length > 0) {
      saveToHistory(tables);
      setTables([]);
      setSelectedId(null);
      toast.info("All tables cleared");
    }
  };

  // Change table color
  const changeTableColor = (newColor) => {
    if (selectedId) {
      saveToHistory(tables);
      setTables(tables.map(table =>
        table.id === selectedId
          ? { ...table, color: newColor }
          : table
      ));
    }
  };

  // Change table status
  const changeTableStatus = (newStatus) => {
    if (selectedId) {
      saveToHistory(tables);
      setTables(tables.map(table =>
        table.id === selectedId
          ? { ...table, status: newStatus }
          : table
      ));
      
      const table = tables.find(t => t.id === selectedId);
      toast.info(`Table ${table.tableNumber} status changed to ${newStatus}`);
    }
  };

  // Rotate selected table
  const rotateTable = (degrees) => {
    if (selectedId) {
      saveToHistory(tables);
      setTables(tables.map(table =>
        table.id === selectedId
          ? { ...table, rotation: (table.rotation || 0) + degrees }
          : table
      ));
    }
  };

  // Duplicate selected table
  const duplicateTable = () => {
    if (selectedId) {
      const tableToClone = tables.find(table => table.id === selectedId);
      if (tableToClone) {
        saveToHistory(tables);
        
        const newTable = {
          ...tableToClone,
          id: `table-${Date.now()}-${Math.random()}`,
          tableNumber: tables.length + 1,
          x: tableToClone.x + 50,
          y: tableToClone.y + 50
        };

        const validPosition = findValidPosition(newTable, tables);
        const finalTable = { ...newTable, ...validPosition };

        setTables([...tables, finalTable]);
        toast.success(`Table ${tableToClone.tableNumber} duplicated`);
      }
    }
  };

  // Assign table to zone
  const assignTableToZone = (zoneId) => {
    if (selectedId) {
      saveToHistory(tables);
      setTables(tables.map(table =>
        table.id === selectedId
          ? { ...table, zoneId }
          : table
      ));
    }
  };

  // Start drawing a new zone
  const startDrawingZone = () => {
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    
    setNewZone({
      startX: (pointerPosition.x - position.x) / scale,
      startY: (pointerPosition.y - position.y) / scale,
      width: 0,
      height: 0,
      name: `Zone ${zones.length + 1}`,
      color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.1)`,
      id: `zone-${Date.now()}`
    });
    
    setIsDrawingZone(true);
  };

  // Update zone being drawn
   // Update zone being drawn
   const updateDrawingZone = () => {
    if (!isDrawingZone || !newZone) return;
    
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    
    setNewZone({
      ...newZone,
      width: ((pointerPosition.x - position.x) / scale) - newZone.startX,
      height: ((pointerPosition.y - position.y) / scale) - newZone.startY
    });
  };

  // Finish drawing a zone
  const finishDrawingZone = () => {
    if (!isDrawingZone || !newZone) return;
    
    // Only create zone if it has some size
    if (Math.abs(newZone.width) > 10 && Math.abs(newZone.height) > 10) {
      // Normalize negative dimensions
      const normalizedZone = {
        ...newZone,
        startX: newZone.width < 0 ? newZone.startX + newZone.width : newZone.startX,
        startY: newZone.height < 0 ? newZone.startY + newZone.height : newZone.startY,
        width: Math.abs(newZone.width),
        height: Math.abs(newZone.height)
      };
      
      setZones([...zones, normalizedZone]);
      toast.success(`Zone "${normalizedZone.name}" created`);
    }
    
    setIsDrawingZone(false);
    setNewZone(null);
  };

  // Delete a zone
  const deleteZone = (zoneId) => {
    setZones(zones.filter(zone => zone.id !== zoneId));
    
    // Update tables that were in this zone
    setTables(tables.map(table => 
      table.zoneId === zoneId ? { ...table, zoneId: null } : table
    ));
    
    toast.error("Zone deleted");
  };

  // Rename a zone
  const renameZone = (zoneId, newName) => {
    setZones(zones.map(zone => 
      zone.id === zoneId ? { ...zone, name: newName } : zone
    ));
  };

  // Save layout to localStorage
  const saveLayout = (layoutName = "default") => {
    try {
      const layout = {
        tables,
        zones,
        name: layoutName,
        timestamp: new Date().toISOString()
      };
      
      // Get existing layouts
      const savedLayouts = JSON.parse(localStorage.getItem('floorLayouts') || '{}');
      savedLayouts[layoutName] = layout;
      
      localStorage.setItem('floorLayouts', JSON.stringify(savedLayouts));
      toast.success(`Layout "${layoutName}" saved successfully`);
      return true;
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout");
      return false;
    }
  };

  // Load layout from localStorage
  const loadLayout = (layoutName = "default") => {
    try {
      const savedLayouts = JSON.parse(localStorage.getItem('floorLayouts') || '{}');
      const layout = savedLayouts[layoutName];
      
      if (layout) {
        saveToHistory(tables); // Save current state for undo
        setTables(layout.tables || []);
        setZones(layout.zones || []);
        toast.success(`Layout "${layoutName}" loaded successfully`);
        return true;
      } else {
        toast.warning(`Layout "${layoutName}" not found`);
        return false;
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      toast.error("Failed to load layout");
      return false;
    }
  };

  // Get all saved layouts
  const getSavedLayouts = () => {
    try {
      return JSON.parse(localStorage.getItem('floorLayouts') || '{}');
    } catch {
      return {};
    }
  };

  // Export layout as JSON
  const exportLayout = () => {
    try {
      const layout = {
        tables,
        zones,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `floor-layout-${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast.success("Layout exported successfully");
    } catch (error) {
      console.error("Error exporting layout:", error);
      toast.error("Failed to export layout");
    }
  };

  // Import layout from JSON file
  const importLayout = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const layout = JSON.parse(e.target.result);
          if (layout.tables && Array.isArray(layout.tables)) {
            saveToHistory(tables); // Save current state for undo
            setTables(layout.tables);
            if (layout.zones && Array.isArray(layout.zones)) {
              setZones(layout.zones);
            }
            toast.success("Layout imported successfully");
          } else {
            toast.error("Invalid layout file format");
          }
        } catch (parseError) {
          console.error("Error parsing layout file:", parseError);
          toast.error("Failed to parse layout file");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing layout:", error);
      toast.error("Failed to import layout");
    }
  };

  // Add a reservation to a table
  const addReservation = (tableId, reservation) => {
    if (!tableId) return;
    
    setReservations({
      ...reservations,
      [tableId]: [...(reservations[tableId] || []), {
        ...reservation,
        id: `reservation-${Date.now()}-${Math.random()}`
      }]
    });
    
    // Update table status to reserved
    setTables(tables.map(table => 
      table.id === tableId ? { ...table, status: 'reserved' } : table
    ));
    
    toast.success(`Reservation added for ${reservation.name}`);
  };

  // Remove a reservation
  const removeReservation = (tableId, reservationId) => {
    if (!tableId || !reservations[tableId]) return;
    
    const updatedTableReservations = reservations[tableId].filter(r => r.id !== reservationId);
    
    setReservations({
      ...reservations,
      [tableId]: updatedTableReservations
    });
    
    // If no more reservations, update table status to available
    if (updatedTableReservations.length === 0) {
      setTables(tables.map(table => 
        table.id === tableId ? { ...table, status: 'available' } : table
      ));
    }
    
    toast.info("Reservation removed");
  };

  // Handle zoom in/out
  const handleZoom = (newScale) => {
    setScale(Math.min(Math.max(0.5, newScale), 3));
  };

  // Handle stage drag
  const handleStageDrag = (e) => {
    if (isDrawingZone) return;
    setPosition({
      x: e.target.x(),
      y: e.target.y()
    });
  };

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    
    const pointerPosition = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointerPosition.x - position.x) / oldScale,
      y: (pointerPosition.y - position.y) / oldScale,
    };
    
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setScale(Math.min(Math.max(0.5, newScale), 3));
    
    setPosition({
      x: pointerPosition.x - mousePointTo.x * newScale,
      y: pointerPosition.y - mousePointTo.y * newScale,
    });
  };

  // Reset view
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Get selected table info
  const selectedTable = tables.find(table => table.id === selectedId);

  // Get table reservations
  const getTableReservations = (tableId) => {
    return reservations[tableId] || [];
  };

  // Check if a table has active reservations for the current time
  const hasActiveReservation = (tableId) => {
    if (!reservations[tableId]) return false;
    
    const now = currentTime;
    return reservations[tableId].some(reservation => {
      const startTime = new Date(reservation.startTime);
      const endTime = new Date(reservation.endTime);
      return now >= startTime && now <= endTime;
    });
  };

  // Get tables by zone
  const getTablesByZone = (zoneId) => {
    return tables.filter(table => table.zoneId === zoneId);
  };

  // Get tables by status
  const getTablesByStatus = (status) => {
    return tables.filter(table => table.status === status);
  };

  // Table component with animations
  const TableComponent = ({ table, isSelected, onSelect, onDragEnd }) => {
    // Calculate status indicator color
    const statusColor = tableStatuses.find(s => s.id === table.status)?.color || '#4CAF50';
    
    // Check if table has active reservation
    const isReserved = hasActiveReservation(table.id);
    
    return (
      <Group
        x={table.x}
        y={table.y}
        draggable={viewMode === 'edit'}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        rotation={table.rotation || 0}
      >
        {/* Table surface */}
        {table.shape === 'circle' ? (
          <Circle
            radius={table.width / 2}
            fill={table.color}
            stroke={isSelected ? '#FFD700' : '#333'}
            strokeWidth={isSelected ? 4 : 1}
            shadowColor="black"
            shadowBlur={8}
            shadowOpacity={0.4}
            shadowOffsetX={3}
            shadowOffsetY={3}
          />
        ) : (
          <Rect
            width={table.width}
            height={table.height}
            fill={table.color}
            stroke={isSelected ? '#FFD700' : '#333'}
            strokeWidth={isSelected ? 4 : 1}
            cornerRadius={8}
            shadowColor="black"
            shadowBlur={8}
            shadowOpacity={0.4}
            shadowOffsetX={3}
            shadowOffsetY={3}
          />
        )}

        {/* Status indicator */}
        <Circle
          x={table.shape === 'circle' ? 0 : table.width - 10}
          y={table.shape === 'circle' ? -table.height/2 + 10 : 10}
          radius={8}
          fill={statusColor}
          stroke="#333"
          strokeWidth={1}
        />

        {/* Reservation indicator (blinking if active) */}
        {isReserved && (
          <Circle
            x={table.shape === 'circle' ? 0 : table.width - 30}
            y={table.shape === 'circle' ? -table.height/2 + 10 : 10}
            radius={8}
            fill="#FFC107"
            opacity={Math.abs(Math.sin(Date.now() / 500))}
          />
        )}

        {/* Table number */}
        <Text
          x={table.shape === 'circle' ? 0 : table.width / 2}
          y={table.shape === 'circle' ? 0 : table.height / 2 - 8}
          text={`T${table.tableNumber}`}
          fontSize={14}
          fontFamily="Arial"
          fill="white"
          fontStyle="bold"
          align="center"
          offsetX={table.shape === 'circle' ? 12 : 12}
          offsetY={table.shape === 'circle' ? 8 : 0}
        />

        {/* Seat count */}
        <Text
          x={table.shape === 'circle' ? 0 : table.width / 2}
          y={table.shape === 'circle' ? 15 : table.height / 2 + 8}
          text={`${table.seats} seats`}
          fontSize={10}
          fontFamily="Arial"
          fill="white"
          align="center"
          offsetX={table.shape === 'circle' ? 18 : 18}
        />

        {/* Seat indicators around the table */}
        {Array.from({ length: table.seats }).map((_, index) => {
          const angle = (index / table.seats) * 2 * Math.PI;
          const radiusX = table.shape === 'circle' ? table.width / 2 + 20 : table.width / 2 + 25;
          const radiusY = table.shape === 'circle' ? table.width / 2 + 20 : table.height / 2 + 25;
          const seatX = (table.shape === 'circle' ? 0 : table.width / 2) + Math.cos(angle) * radiusX;
          const seatY = (table.shape === 'circle' ? 0 : table.height / 2) + Math.sin(angle) * radiusY;

          return (
            <Circle
              key={index}
              x={seatX}
              y={seatY}
              radius={8}
              fill={table.status === 'occupied' ? '#F44336' : '#666'}
              stroke="#333"
              strokeWidth={1}
            />
          );
        })}
      </Group>
    );
  };

  // Zone component
  const ZoneComponent = ({ zone }) => {
    return (
      <Group>
        <Rect
          x={zone.startX}
          y={zone.startY}
          width={zone.width}
          height={zone.height}
          fill={zone.color}
          stroke={activeZone === zone.id ? '#2196F3' : 'rgba(0,0,0,0.2)'}
          strokeWidth={activeZone === zone.id ? 2 : 1}
          dash={[10, 5]}
          onClick={() => setActiveZone(zone.id)}
        />
        <Text
          x={zone.startX + 10}
          y={zone.startY + 10}
          text={zone.name}
          fontSize={14}
          fontFamily="Arial"
          fill="rgba(0,0,0,0.7)"
          fontStyle="bold"
        />
      </Group>
    );
  };

  // Grid component
  const GridComponent = () => {
    const gridSize = 20;
    const width = window.innerWidth * 3;
    const height = window.innerHeight * 3;
    const startX = -width / 2;
    const startY = -height / 2;
    
    return (
      <Group opacity={0.1}>
        {/* Horizontal lines */}
        {Array.from({ length: Math.ceil(height / gridSize) }).map((_, i) => (
          <Line
            key={`h-${i}`}
            points={[startX, startY + i * gridSize, startX + width, startY + i * gridSize]}
            stroke="#000"
            strokeWidth={1}
          />
        ))}
        
        {/* Vertical lines */}
        {Array.from({ length: Math.ceil(width / gridSize) }).map((_, i) => (
          <Line
            key={`v-${i}`}
            points={[startX + i * gridSize, startY, startX + i * gridSize, startY + height]}
            stroke="#000"
            strokeWidth={1}
          />
        ))}
      </Group>
    );
  };

  // Reservation Form Component
  const ReservationForm = ({ tableId, onSubmit, onCancel }) => {
    const [reservation, setReservation] = useState({
      name: '',
      partySize: 2,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      phone: '',
      notes: ''
    });

    const handleChange = (e) => {
      setReservation({
        ...reservation,
        [e.target.name]: e.target.value
      });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(tableId, reservation);
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-bold mb-3">New Reservation</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Guest Name</label>
            <input
              type="text"
              name="name"
              value={reservation.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Party Size</label>
            <input
              type="number"
              name="partySize"
              value={reservation.partySize}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={reservation.startTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={reservation.endTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={reservation.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={reservation.notes}
              onChange={handleChange}
              rows="2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Reservation
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  // Save Layout Form
  const SaveLayoutForm = ({ onSave, onCancel }) => {
    const [layoutName, setLayoutName] = useState("My Layout");
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(layoutName);
    };
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-bold mb-3">Save Layout</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Layout Name</label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  // Load Layout Form
  const LoadLayoutForm = ({ onLoad, onCancel }) => {
    const [selectedLayout, setSelectedLayout] = useState("");
    const savedLayouts = getSavedLayouts();
    const layoutOptions = Object.keys(savedLayouts);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onLoad(selectedLayout);
    };
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-bold mb-3">Load Layout</h3>
        {layoutOptions.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Select Layout</label>
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">-- Select a layout --</option>
                {layoutOptions.map(name => (
                  <option key={name} value={name}>
                    {name} ({new Date(savedLayouts[name].timestamp).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedLayout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Load
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No saved layouts found</p>
            <button
              onClick={onCancel}
              className="mt-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  // State for modal forms
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [reservationTableId, setReservationTableId] = useState(null);

  // Handle reservation form submission
  const handleReservationSubmit = (tableId, reservation) => {
    addReservation(tableId, reservation);
    setShowReservationForm(false);
    setReservationTableId(null);
  };

  // Open reservation form for a table
  const openReservationForm = (tableId) => {
    setReservationTableId(tableId);
    setShowReservationForm(true);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      {/* Main Stage Area */}
      <div
        className="flex-1 bg-white relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          width={window.innerWidth - 320}
          height={window.innerHeight}
          ref={stageRef}
          onClick={(e) => {
            // Deselect when clicking empty area
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
          onWheel={handleWheel}
          draggable={!isDrawingZone}
          onDragMove={handleStageDrag}
          onMouseMove={updateDrawingZone}
          onMouseDown={isDrawingZone ? startDrawingZone : undefined}
          onMouseUp={isDrawingZone ? finishDrawingZone : undefined}
          x={position.x}
          y={position.y}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {/* Grid */}
            {showGrid && <GridComponent />}
            
            {/* Zones */}
            {zones.map((zone) => (
              <ZoneComponent key={zone.id} zone={zone} />
            ))}
            
            {/* Drawing new zone */}
            {isDrawingZone && newZone && (
              <Rect
                x={newZone.startX}
                y={newZone.startY}
                width={newZone.width}
                height={newZone.height}
                fill="rgba(33, 150, 243, 0.2)"
                stroke="#2196F3"
                strokeWidth={2}
                dash={[10, 5]}
              />
            )}
            
            {tables.map((table) => (
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

        {/* View Controls Overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button 
            onClick={() => handleZoom(scale + 0.1)} 
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(scale - 0.1)} 
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={resetView} 
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'} hover:bg-gray-200`}
            title={showGrid ? "Hide Grid" : "Show Grid"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h5v5H5V5zm0 7h5v3H5v-3zm7-7h3v3h-3V5zm0 5h3v5h-3v-5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-1 flex">
          <button 
            onClick={() => setViewMode('edit')} 
            className={`px-3 py-2 rounded ${viewMode === 'edit' ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Edit Mode"
          >
            Edit
          </button>
          <button 
            onClick={() => setViewMode('service')} 
            className={`px-3 py-2 rounded ${viewMode === 'service' ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Service Mode"
          >
            Service
          </button>
          <button 
            onClick={() => setViewMode('reservation')} 
            className={`px-3 py-2 rounded ${viewMode === 'reservation' ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Reservation Mode"
          >
            Reservations
          </button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button 
            onClick={undo} 
            disabled={undoStack.length === 0}
            className={`p-2 rounded ${undoStack.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Undo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={redo} 
            disabled={redoStack.length === 0}
            className={`p-2 rounded ${redoStack.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Redo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Instructions overlay */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center text-gray-400"
            >
              <h3 className="text-2xl font-bold mb-2">Restaurant Floor Plan</h3>
              <p className="text-lg">Drag tables from the sidebar to start designing your layout</p>
              <p className="mt-2">Use mouse wheel to zoom in/out and drag to pan the view</p>
            </motion.div>
          </div>
        )}

        {/* Modal Forms */}
        {showReservationForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <ReservationForm 
              tableId={reservationTableId}
              onSubmit={handleReservationSubmit}
              onCancel={() => setShowReservationForm(false)}
            />
          </div>
        )}

        {showSaveForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <SaveLayoutForm 
              onSave={(name) => {
                saveLayout(name);
                setShowSaveForm(false);
              }}
              onCancel={() => setShowSaveForm(false)}
            />
          </div>
        )}

        {showLoadForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <LoadLayoutForm 
              onLoad={(name) => {
                loadLayout(name);
                setShowLoadForm(false);
              }}
              onCancel={() => setShowLoadForm(false)}
            />
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 text-white overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Floor Management</h2>

          {/* Mode-specific controls */}
          {viewMode === 'edit' && (
            <>
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
                  <button
                    onClick={() => setIsDrawingZone(!isDrawingZone)}
                    className={`${isDrawingZone ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded w-full transition-colors`}
                  >
                    {isDrawingZone ? 'Cancel Drawing Zone' : 'Draw New Zone'}
                  </button>
                  <button
                    onClick={() => setShowSaveForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full transition-colors"
                  >
                    Save Layout
                  </button>
                  <button
                    onClick={() => setShowLoadForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full transition-colors"
                  >
                    Load Layout
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportLayout}
                      className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 flex-1 transition-colors"
                    >
                      Export
                    </button>
                    <label className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 flex-1 transition-colors text-center cursor-pointer">
                      Import
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importLayout} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-300">
                  Total Tables: {tables.length} | Selected: {selectedTable ? `T${selectedTable.tableNumber}` : 'None'}
                </div>
              </div>

              {/* Selected Table Controls */}
              {selectedTable && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-900 rounded-lg"
                >
                  <h3 className="font-bold mb-3">Table T{selectedTable.tableNumber} Settings</h3>
                  
                  {/* Table Actions */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={deleteTable}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={duplicateTable}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      Duplicate
                    </button>
                  </div>
                  
                  {/* Rotation Controls */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 mb-2">Rotation:</p>
                    <div className="flex justify-between">
                      <button
                        onClick={() => rotateTable(-45)}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        -45°
                      </button>
                      <button
                        onClick={() => rotateTable(-15)}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        -15°
                      </button>
                      <button
                        onClick={() => rotateTable(15)}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        +15°
                      </button>
                      <button
                        onClick={() => rotateTable(45)}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        +45°
                      </button>
                    </div>
                  </div>
                  
                  {/* Zone Assignment */}
                  <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Assign to Zone:</p>
                    <select
                      value={selectedTable.zoneId || ''}
                      onChange={(e) => assignTableToZone(e.target.value || null)}
                      className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600"
                    >
                      <option value="">No Zone</option>
                      {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Table Status */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 mb-2">Table Status:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {tableStatuses.map(status => (
                        <button
                          key={status.id}
                          onClick={() => changeTableStatus(status.id)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedTable.status === status.id 
                              ? 'ring-2 ring-white' 
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color Selection */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-300 mb-2">Change Color:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {colorVariations.slice(0, 15).map((color) => (
                        <button
                          key={color}
                          onClick={() => changeTableColor(color)}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedTable.color === color ? 'border-white' : 'border-gray-600'
                          } hover:border-gray-300 transition-colors`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {colorVariations.slice(15).map((color) => (
                        <button
                          key={color}
                          onClick={() => changeTableColor(color)}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedTable.color === color ? 'border-white' : 'border-gray-600'
                          } hover:border-gray-300 transition-colors`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Table Info */}
                  <div className="text-sm text-gray-300 mt-4 border-t border-gray-700 pt-3">
                    <p>Seats: {selectedTable.seats}</p>
                    <p>Position: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})</p>
                    <p>Size: {selectedTable.width}×{selectedTable.height}</p>
                    <p>Rotation: {selectedTable.rotation || 0}°</p>
                    <p>Shape: {selectedTable.shape || 'rectangle'}</p>
                    <p>Created: {new Date(selectedTable.createdAt).toLocaleString()}</p>
                  </div>
                </motion.div>
              )}

              {/* Zone Management */}
              {zones.length > 0 && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-bold mb-3">Zones</h3>
                  <div className="space-y-2">
                    {zones.map(zone => (
                      <div 
                        key={zone.id} 
                        className={`p-2 rounded flex justify-between items-center ${
                          activeZone === zone.id ? 'bg-blue-900' : 'bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2" 
                            style={{ backgroundColor: zone.color.replace('0.1', '0.8') }}
                          ></div>
                          <span>{zone.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setActiveZone(zone.id === activeZone ? null : zone.id)}
                            className="p-1 text-gray-300 hover:text-white"
                            title={activeZone === zone.id ? "Deselect Zone" : "Select Zone"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              const newName = prompt("Enter new zone name:", zone.name);
                              if (newName) renameZone(zone.id, newName);
                            }}
                            className="p-1 text-gray-300 hover:text-white"
                            title="Rename Zone"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteZone(zone.id)}
                            className="p-1 text-gray-300 hover:text-red-400"
                            title="Delete Zone"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
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
                    <motion.div
                      key={tableType.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tableType)}
                      className="bg-gray-700 p-4 rounded-lg cursor-move hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-gray-500"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{tableType.name}</h4>
                          <p className="text-sm text-gray-300">{tableType.seats} seats</p>
                          <p className="text-xs text-gray-400">
                            Size: {tableType.width}×{tableType.height}
                          </p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold mb-1 ${
                              tableType.shape === 'circle' ? 'rounded-full' : 'rounded'
                            }`}
                            style={{ backgroundColor: tableType.color }}
                          >
                            {tableType.seats}
                          </div>
                          <p className="text-xs text-gray-400">Drag to add</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Service Mode Controls */}
          {viewMode === 'service' && (
            <>
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-3">Service Dashboard</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Table Status Overview:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tableStatuses.map(status => {
                      const count = getTablesByStatus(status.id).length;
                      return (
                        <div 
                          key={status.id}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: `${status.color}30` }}
                        >
                          <span className="text-sm">{status.name}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Zone Occupancy:</p>
                  <div className="space-y-2">
                    {zones.map(zone => {
                      const zoneTables = getTablesByZone(zone.id);
                      const occupiedTables = zoneTables.filter(t => t.status === 'occupied').length;
                      const totalTables = zoneTables.length;
                      const occupancyRate = totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0;
                      
                      return (
                        <div key={zone.id} className="p-2 bg-gray-600 rounded">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{zone.name}</span>
                            <span className="text-sm font-medium">{occupiedTables}/{totalTables} ({occupancyRate}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {selectedTable && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h4 className="font-medium mb-2">Table T{selectedTable.tableNumber} Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tableStatuses.map(status => (
                        <button
                          key={status.id}
                          onClick={() => changeTableStatus(status.id)}
                          className="px-3 py-2 rounded text-sm font-medium"
                          style={{ backgroundColor: status.color }}
                        >
                          {status.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Table List */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-3">Tables</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                  {tables.length > 0 ? (
                    <div className="space-y-2">
                      {tables.map(table => {
                        const status = tableStatuses.find(s => s.id === table.status);
                        return (
                          <div 
                            key={table.id}
                            className={`p-3 rounded cursor-pointer flex items-center ${
                              selectedId === table.id ? 'bg-blue-900' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                            onClick={() => {
                              setSelectedId(table.id);
                              // Center view on table
                              setPosition({
                                x: window.innerWidth / 2 - table.x * scale,
                                y: window.innerHeight / 2 - table.y * scale
                              });
                            }}
                          >
                            <div 
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: status?.color || '#4CAF50' }}
                            ></div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">Table {table.tableNumber}</span>
                                <span className="text-sm">{table.seats} seats</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-300 mt-1">
                                <span>{status?.name || 'Available'}</span>
                                <span>{table.zoneId ? zones.find(z => z.id === table.zoneId)?.name : 'No Zone'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No tables added yet</p>
                )}
                </div>
              </div>
            </>
          )}

          {/* Reservation Mode Controls */}
          {viewMode === 'reservation' && (
            <>
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-3">Reservations</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Current Time:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      value={currentTime.toISOString().slice(0, 16)}
                      onChange={(e) => setCurrentTime(new Date(e.target.value))}
                      className="bg-gray-800 text-white rounded p-2 border border-gray-600 flex-1"
                    />
                    <button
                      onClick={() => setCurrentTime(new Date())}
                      className="p-2 bg-blue-600 rounded hover:bg-blue-700"
                      title="Reset to current time"
                    >
                      Now
                    </button>
                  </div>
                </div>
                
                {selectedTable && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Table T{selectedTable.tableNumber} Reservations</h4>
                      <button
                        onClick={() => openReservationForm(selectedTable.id)}
                        className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    
                    {getTableReservations(selectedTable.id).length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {getTableReservations(selectedTable.id).map(reservation => {
                          const startTime = new Date(reservation.startTime);
                          const endTime = new Date(reservation.endTime);
                          const isActive = currentTime >= startTime && currentTime <= endTime;
                          const isPast = currentTime > endTime;
                          
                          return (
                            <div 
                              key={reservation.id}
                              className={`p-3 rounded ${
                                isActive ? 'bg-green-900' : isPast ? 'bg-gray-600 opacity-60' : 'bg-blue-900'
                              }`}
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">{reservation.name}</span>
                                <span className="text-sm">{reservation.partySize} guests</span>
                              </div>
                              <div className="text-xs text-gray-300 mt-1">
                                <div className="flex justify-between">
                                  <span>
                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span>{startTime.toLocaleDateString()}</span>
                                </div>
                                {reservation.phone && <p className="mt-1">📞 {reservation.phone}</p>}
                                {reservation.notes && <p className="mt-1 italic">{reservation.notes}</p>}
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => removeReservation(selectedTable.id, reservation.id)}
                                  className="px-2 py-1 bg-red-700 rounded text-xs hover:bg-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-3 text-sm">No reservations for this table</p>
                    )}
                  </div>
                )}
                
                {!selectedTable && (
                  <div className="text-center py-4 text-gray-400">

                    <p>Select a table to manage reservations</p>
                  </div>
                )}
              </div>
              
              {/* Upcoming Reservations */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-3">Upcoming Reservations</h3>
                
                {Object.entries(reservations).length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {Object.entries(reservations)
                      .flatMap(([tableId, tableReservations]) => 
                        tableReservations.map(res => ({
                          ...res,
                          tableId,
                          tableNumber: tables.find(t => t.id === tableId)?.tableNumber
                        }))
                      )
                      .filter(res => new Date(res.startTime) > currentTime)
                      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                      .slice(0, 10)
                      .map(reservation => {
                        const startTime = new Date(reservation.startTime);
                        const timeUntil = startTime - currentTime;
                        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
                        
                        return (
                          <div 
                            key={reservation.id}
                            className="p-3 bg-gray-600 rounded"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{reservation.name}</span>
                              <span 
                                className="text-sm font-medium px-2 py-0.5 rounded-full bg-blue-900"
                                onClick={() => {
                                  setSelectedId(reservation.tableId);
                                  const table = tables.find(t => t.id === reservation.tableId);
                                  if (table) {
                                    setPosition({
                                      x: window.innerWidth / 2 - table.x * scale,
                                      y: window.innerHeight / 2 - table.y * scale
                                    });
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                T{reservation.tableNumber}
                              </span>
                            </div>
                            <div className="text-xs text-gray-300 mt-1">
                              <p>
                                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' on '}
                                {startTime.toLocaleDateString()}
                              </p>
                              <p className="mt-1">{reservation.partySize} guests</p>
                              <p className="mt-1 text-yellow-300">
                                In {hoursUntil}h {minutesUntil}m
                              </p>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No upcoming reservations</p>
                )}
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-bold mb-3">Help</h3>
            <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
              {viewMode === 'edit' && (
                <>
                  <li>Drag tables from the sidebar to the floor plan</li>
                  <li>Click on a table to select it</li>
                  <li>Drag tables to reposition them</li>
                  <li>Use controls to modify selected tables</li>
                  <li>Draw zones to organize your floor plan</li>
                  <li>Save your layout when finished</li>
                </>
              )}
              {viewMode === 'service' && (
                <>
                  <li>Click on tables to select them</li>
                  <li>Change table status for service tracking</li>
                  <li>Monitor zone occupancy rates</li>
                  <li>Use the table list for quick navigation</li>
                </>
              )}
              {viewMode === 'reservation' && (
                <>
                  <li>Click on tables to manage reservations</li>
                  <li>Add new reservations to selected tables</li>
                  <li>Adjust current time to see scheduled reservations</li>
                  <li>View upcoming reservations across all tables</li>
                </>
              )}
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>Restaurant Floor Management Tool</p>
            <p className="mt-1">© {new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorManagement;


