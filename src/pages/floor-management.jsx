import React, { useState, useRef } from 'react';
import { Stage, Layer, Group, Rect, Text, Circle } from 'react-konva';

const FloorManagement = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef();
  const dragUrl = useRef();

  // Table configurations with different seat counts
  const tableTypes = [
    { id: '8-seater', seats: 8, width: 120, height: 80, color: '#4CAF50', name: '8 Seater' },
    { id: '6-seater', seats: 6, width: 100, height: 70, color: '#2196F3', name: '6 Seater' },
    { id: '4-seater', seats: 4, width: 80, height: 60, color: '#FF9800', name: '4 Seater' },
    { id: '2-seater', seats: 2, width: 60, height: 50, color: '#E91E63', name: '2 Seater' }
  ];

  // Check if position overlaps with existing tables
  const checkOverlap = (newTable, existingTables, margin = 30) => {
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
    let x = newTable.x;
    let y = newTable.y;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const testTable = { ...newTable, x, y };
      if (!checkOverlap(testTable, existingTables)) {
        return { x, y };
      }
      
      // Try nearby positions
      x += 20;
      if (x > 700) {
        x = 50;
        y += 20;
      }
      attempts++;
    }
    
    return { x: newTable.x, y: newTable.y };
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
    
    const newTable = {
      ...dragUrl.current,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: `table-${Date.now()}-${Math.random()}`,
      tableNumber: tables.length + 1
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
          strokeWidth={isSelected ? 3 : 1}
          cornerRadius={8}
          shadowColor="black"
          shadowBlur={5}
          shadowOpacity={0.3}
          shadowOffsetX={2}
          shadowOffsetY={2}
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
          const radiusX = table.width / 2 + 20;
          const radiusY = table.height / 2 + 20;
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

        {/* Controls */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-lg">
          <h3 className="font-bold mb-2">Floor Controls</h3>
          <div className="space-y-2">
            {selectedId && (
              <button
                onClick={deleteTable}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
              >
                Delete Selected Table
              </button>
            )}
            <button
              onClick={clearAllTables}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
            >
              Clear All Tables
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Total Tables: {tables.length}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Floor Management</h2>
        
        {/* Table Types */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Drag Tables to Floor</h3>
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
                  <div
                    className="w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tableType.color }}
                  >
                    {tableType.seats}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ← Drag to add to floor
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Tables */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Current Tables ({tables.length})
          </h3>
          {tables.length === 0 ? (
            <p className="text-gray-400 text-sm">No tables on floor yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedId(table.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedId === table.id 
                      ? 'bg-blue-600 border-2 border-blue-400' 
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Table {table.tableNumber}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{table.seats} seats</span>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: table.color }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">
                    Position: ({Math.round(table.x)}, {Math.round(table.y)})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">How to Use</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Drag table types from above to the floor</li>
            <li>• Click any table to select it</li>
            <li>• Drag tables around to reposition them</li>
            <li>• Tables automatically avoid overlapping</li>
            <li>• Use controls to delete selected tables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FloorManagement;
