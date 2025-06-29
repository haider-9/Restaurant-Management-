import React from 'react'
import { Group, Circle, RegularPolygon, Text } from 'react-konva'
import { useFloorManagement } from '../context/FloorManagementContext'

const ReservationPin = ({ table, onDragStart, onDragMove, onDragEnd }) => {
  const { formatTime } = useFloorManagement()

  if (table.status !== 'reserved') return null

  const pinX = table.width / 2
  const pinY = -30; // Position above the table

  return (
    <Group
      x={pinX}
      y={pinY}
      draggable
      onDragStart={(e) => {
        const pos = e.target.getStage().getPointerPosition()
        onDragStart(table.id, pos.x, pos.y)
      }}
      onDragMove={(e) => {
        const pos = e.target.getStage().getPointerPosition()
        onDragMove(pos.x, pos.y)
      }}
      onDragEnd={(e) => {
        const pos = e.target.getStage().getPointerPosition()
        onDragEnd(pos.x, pos.y)
      }}
    >
      {/* Pin shadow */}
      <Circle
        x={2}
        y={2}
        radius={12}
        fill="rgba(0,0,0,0.3)"
      />
      
      {/* Pin body */}
      <Circle
        radius={12}
        fill="#ef4444"
        stroke="#ffffff"
        strokeWidth={2}
      />
      
      {/* Pin icon */}
      <RegularPolygon
        sides={3}
        radius={6}
        fill="#ffffff"
        rotation={180}
      />
      
      {/* Reservation time text */}
      {table.reservationTime && (
        <Text
          x={-30}
          y={20}
          text={formatTime(table.reservationTime)}
          fontSize={10}
          fill="#333"
          fontFamily="Arial"
          align="center"
          width={60}
        />
      )}
    </Group>
  )
}

export default ReservationPin