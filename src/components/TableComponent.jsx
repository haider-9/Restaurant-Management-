import { useState, useEffect } from "react";
import { Group, Rect, Text, Circle, Image as KonvaImage } from "react-konva";
import { Portal } from "react-konva-utils";
import useImage from "use-image";

const TableSVG = ({ table, onLoad }) => {
  const [image] = useImage(table.svgPath);

  useEffect(() => {
    if (image && onLoad) {
      onLoad(image);
    }
  }, [image, onLoad]);

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

  // Increased table size
  const standardWidth = 120;
  const standardHeight = 120;

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
          width: standardWidth,
          height: standardHeight,
        }}
        onLoad={handleImageLoad}
      />

      {/* Table number - */}
      {table.seats !== 1 && (
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
      {table.seats !== 1 && (
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
            {/* Pin tooltip */}
            <Text
              x={-25}
              y={20}
              text="Drag to swap"
              fontSize={9}
              fill="#333"
              fontFamily="Arial"
              align="center"
              width={50}
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
