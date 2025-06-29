import { useState } from "react";
import { Group, Rect, Text, Circle } from "react-konva";
import { Portal } from "react-konva-utils";

const TableComponent = ({
  table,
  isSelected,
  onSelect,
  handleReservationPinDragEnd,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
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
        stroke={isSelected ? "#FFD700" : "#333"}
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
      {table.status === "reserved" && (
        <Portal selector=".top-layer" enabled={isDragging}>
          <Group
            x={table.width / 2}
            y={table.height / 2}
            zIndex={1000}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const pos = e.target.getStage().getPointerPosition();
              const result = handleReservationPinDragEnd(
                table.id,
                pos.x,
                pos.y
              );
              if (result === false) {
                e.target.position({ x: table.width / 2, y: table.height / 2 });
              }
              setIsDragging(false);
            }}
          >
            <Circle
              radius={12}
              fill="#ff3333"
              stroke="#ff0000"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.4}
            />
            <Rect
              x={-2}
              y={-8}
              width={4}
              height={16}
              fill="white"
              cornerRadius={2}
            />
            <Rect
              x={-8}
              y={-2}
              width={16}
              height={4}
              fill="white"
              cornerRadius={2}
            />
          </Group>
        </Portal>
      )}
    </Group>
  );
};

export default TableComponent;
