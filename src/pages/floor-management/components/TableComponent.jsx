import { useState } from "react";
import { Group, Rect, Text, Circle, Image as KonvaImage } from "react-konva";
import { Portal } from "react-konva-utils";
import useImage from "use-image";

const TableSVG = ({ table, onLoad }) => {
  const [image] = useImage(table.svgPath);

  if (image && onLoad) {
    onLoad(image);
  }

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      width={table.width}
      height={table.height}
      opacity={1}
    />
  );
};

const TableComponent = ({
  table,
  isSelected,
  onSelect,
  handleReservationPinDragEnd,
  onDragEnd,
  userRole,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tableImage, setTableImage] = useState(null);

  // Increased table size with special case for 1 seater
  const standardWidth = table.seats === 1 ? 80 : 120;
  const standardHeight = table.seats === 1 ? 120 : 120;

  const handleImageLoad = (image) => {
    setTableImage(image);
  };

  return (
    <Group
      x={table.x}
      y={table.y}
      draggable={userRole === "admin"}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    >
      {/* Selection border only */}
      {isSelected && (
        <Rect
          width={standardWidth}
          height={standardHeight}
          fill="transparent"
          stroke="#f2f2f2f2"
          strokeWidth={4}
          cornerRadius={10}
        />
      )}

      {/* SVG Table Image */}
      <TableSVG
        table={{
          ...table,
          width: table.type !== "table" ? table.width : standardWidth,
          height: table.type !== "table" ? table.height : standardHeight,
        }}
        onLoad={handleImageLoad}
      />

      {/* Table number - */}
      {table.type === "table" && table.seats !== 1 && (
        <Text
          x={0}
          y={standardHeight / 2 - 12}
          text={`T${table.tableNumber}`}
          fontSize={16}
          fontFamily="Arial"
          fill="#333"
          fontStyle="bold"
          align="center"
          width={standardWidth}
        />
      )}

      {/* Seat count  */}
      {table.type === "table" && table.seats !== 1 && (
        <Text
          x={0}
          y={standardHeight / 2 + 8}
          text={`${table.seats} seats`}
          fontSize={12}
          fontFamily="Arial"
          fill="#666"
          align="center"
          width={standardWidth}
        />
      )}

      {/* Reservation Pin  */}
      {table.status === "reserved" && userRole === "tenant" && (
        <Portal selector=".top-layer" enabled={isDragging}>
          <Group
            x={standardWidth / 2}
            y={standardHeight / 2}
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
                e.target.position({
                  x: standardWidth / 2,
                  y: standardHeight / 2,
                });
              }
              setIsDragging(false);
            }}
          >
            <Circle
              radius={12}
              fill="#ff3333"
              stroke="#ff0000"
              strokeWidth={2}
            />
            <Text
              x={-4}
              y={-5}
              text="R"
              fontSize={12}
              fill="white"
              fontStyle="bold"
            />
          </Group>
        </Portal>
      )}

      {/* Reserved indicator for admin view - positioned in center */}
      {table.status === "reserved" && userRole === "admin" && (
        <Group x={standardWidth / 2} y={standardHeight / 2}>
          <Circle radius={10} fill="#ff3333" stroke="#ff0000" strokeWidth={2} />
          <Text
            x={-4}
            y={-5}
            text="R"
            fontSize={12}
            fill="white"
            fontStyle="bold"
          />
        </Group>
      )}
    </Group>
  );
};

export default TableComponent;
