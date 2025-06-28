import React, { useState, useRef } from 'react';
import { Stage, Layer, Group, Rect, Text, Circle } from 'react-konva';

const FloorManagement = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef();
  const dragUrl = useRef();

  // Table configurations with different seat counts and more colors
  const tableTypes = [
    { id: '8-seater', seats: 8, width: 120, height: 80, color: '#E91E63', name: '8 Seater' },
    { id: '6-seater', seats: 6, width: 100, height: 70, color: '#9C27B0', name: '6 Seater' },
    { id: '4-seater', seats: 4, width: 80, height: 60, color: '#FF5722', name: '4 Seater' },
    { id: '2-seater', seats: 2, width: 60, height: 50, color: '#795548', name: '2 Seater' }
  ];

  // Additional color variations for tables
  const colorVariations = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#607D8B', '#F44336', '#9E9E9E', '#FF6F00'
  ];

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
    const rect = stage.container().getBoundingClientRect();

    // Assign random color variation
    const randomColor = colorVariations[Math.floor(Math.random() * colorVariations.length)];

    const newTable = {
      ...dragUrl.current,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: `table-${Date.now()}-${Math.random()}`,
      tableNumber: tables.length + 1,
      color: randomColor // Override with random color
    };

    const validPosition = findValidPosition(newTable, tables);
    const finalTable = { ...newTable, ...validPosition };

    setTables([...tables, finalTable]);
    dragUrl.current = null;
  };

  // Handle table drag on stage
  const handleTableDragEnd = (e, tableId) => {
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
      setTables(tables.filter(table => table.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Clear all tables
  const clearAllTables = () => {
    setTables([]);
    setSelectedId(null);
  };

  // Change table color
  const changeTableColor = (newColor) => {
    if (selectedId) {
      setTables(tables.map(table =>
        table.id === selectedId
          ? { ...table, color: newColor }
          : table
      ));
    }
  };

  // Duplicate selected table
  const duplicateTable = () => {
    if (selectedId) {
      const tableToClone = tables.find(table => table.id === selectedId);
      if (tableToClone) {
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
      }
    }
  };

  // Get selected table info
  const selectedTable = tables.find(table => table.id === selectedId);

  // Table component
  const TableComponent = ({ table, isSelected, onSelect, onDragEnd }) => {
    return (
      <Group
        x={table.x}
        y={table.y}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
      >
        {/* Table surface */}
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

        {/* Table number */}
        <Text
          x={table.width / 2}
          y={table.height / 2 - 8}
          text={`T${table.tableNumber}`}
          fontSize={14}
          fontFamily="Arial"
          fill="white"
          fontStyle="bold"
          align="center"
          offsetX={12}
        />

        {/* Seat count */}
        <Text
          x={table.width / 2}
          y={table.height / 2 + 8}
          text={`${table.seats} seats`}
          fontSize={10}
          fontFamily="Arial"
          fill="white"
          align="center"
          offsetX={18}
        />

        {/* Seat indicators around the table */}
        {Array.from({ length: table.seats }).map((_, index) => {
          const angle = (index / table.seats) * 2 * Math.PI;
          const radiusX = table.width / 2 + 25;
          const radiusY = table.height / 2 + 25;
          const seatX = table.width / 2 + Math.cos(angle) * radiusX;
          const seatY = table.height / 2 + Math.sin(angle) * radiusY;

          return (
            <Circle
              key={index}
              x={seatX}
              y={seatY}
              radius={8}
              fill="#666"
              stroke="#333"
              strokeWidth={1}
            />
          );
        })}
      </Group>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
        >
          <Layer>
            {/* Render tables */}
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

        {/* Instructions overlay */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <h3 className="text-2xl font-bold mb-2">Restaurant Floor Plan</h3>
              <p className="text-lg">Drag tables from the sidebar to start designing your layout</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Floor Management</h2>

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
            {selectedId && (
              <>
                <button
                  onClick={deleteTable}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 w-full transition-colors"
                >
                  Delete Selected Table
                </button>
                <button
                  onClick={duplicateTable}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full transition-colors"
                >
                  Duplicate Selected Table
                </button>
              </>
            )}
          </div>
          <div className="mt-3 text-sm text-gray-300">
            Total Tables: {tables.length} | Selected: {selectedTable ? `T${selectedTable.tableNumber}` : 'None'}
          </div>
        </div>

        {/* Selected Table Controls */}
        {selectedTable && (
          <div className="mb-6 p-4 bg-blue-900 rounded-lg">
            <h3 className="font-bold mb-3">Table T{selectedTable.tableNumber} Settings</h3>
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
            <div className="text-sm text-gray-300">
              <p>Seats: {selectedTable.seats}</p>
              <p>Position: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})</p>
              <p>Size: {selectedTable.width}×{selectedTable.height}</p>
            </div>
          </div>
        )}

        {/* Table Types */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Add Tables</h3>
          <div className="space-y-4">
            {tableTypes.map((tableType) => (
              <div
                key={tableType.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tableType)}
                className="bg-gray-700 p-4 rounded-lg cursor-move hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-gray-500"
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
                      className="w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold mb-1"
                      style={{ backgroundColor: tableType.color }}
                    >
                      {tableType.seats}
                    </div>
                    <p className="text-xs text-gray-400">Drag to add</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="font-bold mb-3">Help</h3>
          <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
            <li>Drag tables from the sidebar to the floor plan</li>
            <li>Click on a table to select it</li>
            <li>Drag tables to reposition them</li>
            <li>Use controls to modify selected tables</li>
            <li>Tables automatically avoid overlapping</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Restaurant Floor Management Tool</p>
          <p className="mt-1">© {new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default FloorManagement;