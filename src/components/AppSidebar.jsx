import React, { useState } from "react";
import { useFloorManagement } from "../context/FloorManagementContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Copy,
  Clock,
  Users,
  MapPin,
  Calendar,
  HelpCircle,
  GripVertical,
  UserCheck,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarTrigger } from "./ui/sidebar";
import TimePicker from "./ui/time-picker";

const ReservationCard = ({ table, onSelect, formatTime }) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => onSelect(table.id)}
    >
      {/* Top border line */}
      <div className="w-full h-px bg-gray-200 -mt-4 mb-4"></div>

      {/* Top section */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-gray-800 text-sm">
          {table.reservationName || "Guest Name"}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <User className="h-4 w-4" />
          <span className="text-sm">{table.seats}</span>
        </div>
        <div className="text-gray-700 text-sm font-medium">
          Table {String(table.tableNumber).padStart(2, "0")}
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex items-center">
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {table.reservationTime
              ? formatTime(table.reservationTime)
              : "No time set"}
          </span>
        </div>
      </div>

      {/* Bottom border line */}
      <div className="w-full h-px bg-gray-200 mt-4 -mb-4"></div>
    </div>
  );
};

const AppSidebar = () => {
  const {
    tables,
    selectedId,
    sidebarVisible,
    tableTypes,
    tableStatuses,
    dragUrl,
    userRole,
    setSelectedId,
    deleteTable,
    clearAllTables,
    duplicateTable,
    changeTableStatus,
    setReservationTime,
    setReservationName,
    formatTime,
    formatDate,
    getSelectedTable,
    toggleSidebar,
    setUserRole,
    transferReservation,
  } = useFloorManagement();

  const [draggedReservation, setDraggedReservation] = useState(null);

  const selectedTable = getSelectedTable();

  const handleDragStart = (e, tableType) => {
    if (userRole !== "admin") return;
    dragUrl.current = tableType;
  };

  const handleRoleChange = (role) => {
    setUserRole(role);
  };

  const handleReservationNameChange = (e) => {
    setReservationName(e.target.value);
  };

  const handleReservationDragStart = (tableId, x, y) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setDraggedReservation({
        id: tableId,
        reservationName: table.reservationName,
        reservationTime: table.reservationTime,
        seats: table.seats,
      });
    }
  };

  const handleReservationDragMove = (x, y) => {
    // Optional: You can add visual feedback here
    // For now, we'll just track the position
  };

  const handleReservationDragEnd = (x, y) => {
    if (!draggedReservation) return;

    // Find the target table at the drop position
    // This is a simplified version - you might need to adjust based on your floor layout
    const targetTable = tables.find((table) => {
      // Check if the drop position is within the table bounds
      // You'll need to adjust this logic based on your actual table positioning
      const tableRect = {
        x: table.x,
        y: table.y,
        width: table.width,
        height: table.height,
      };

      return (
        x >= tableRect.x &&
        x <= tableRect.x + tableRect.width &&
        y >= tableRect.y &&
        y <= tableRect.y + tableRect.height &&
        table.id !== draggedReservation.id
      );
    });

    if (targetTable) {
      // Transfer the reservation
      if (transferReservation) {
        transferReservation(draggedReservation.id, targetTable.id);
      } else {
        // Fallback: manually transfer reservation data
        // Clear original table
        const originalTable = tables.find(
          (t) => t.id === draggedReservation.id
        );
        if (originalTable) {
          // Update original table
          changeTableStatus("free"); // or whatever status you want
          setReservationName("");
          setReservationTime(null);
        }

        // Set new table
        setSelectedId(targetTable.id);
        changeTableStatus("reserved");
        setReservationName(draggedReservation.reservationName);
        setReservationTime(draggedReservation.reservationTime);
      }
    }

    // Reset drag state
    setDraggedReservation(null);
  };

  return (
    <div className="relative">
      <SidebarTrigger
        className={
          "fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100"
        }
      >
        toggle
      </SidebarTrigger>
      <Sidebar visible={sidebarVisible} onToggle={toggleSidebar}>
        <SidebarContent>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <div className="text-center">
                <h2 className="text-xl font-bold">Floor Management</h2>
                <p className="text-sm">Manage your restaurant layout</p>
              </div>

              {/* Role Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    User Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={userRole} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="tenant">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Tenant
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Current role: <Badge variant="outline">{userRole}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Admin-only Floor Controls */}
              {userRole === "admin" && (
                <Card className="">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      Floor Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={clearAllTables}
                      className="w-full"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Tables ({tables.length})
                    </Button>

                    {selectedId && (
                      <div className="space-y-2">
                        <Button
                          onClick={deleteTable}
                          variant="destructive"
                          className="w-full"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected Table
                        </Button>
                        <Button
                          onClick={duplicateTable}
                          variant="secondary"
                          className="w-full"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Selected Table
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span>
                        Total Tables:{" "}
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300"
                        >
                          {tables.length}
                        </Badge>
                      </span>
                      <span>
                        Selected:{" "}
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300"
                        >
                          {selectedTable
                            ? `T${selectedTable.tableNumber}`
                            : "None"}
                        </Badge>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {userRole === "tenant" &&
                tables.filter(
                  (t) => t.status === "reserved" && t.reservationTime
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Upcoming Reservations
                        <Badge variant="secondary" className="ml-auto">
                          Drag to transfer
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {tables
                            .filter(
                              (t) =>
                                t.status === "reserved" && t.reservationTime
                            )
                            .sort(
                              (a, b) =>
                                new Date(a.reservationTime) -
                                new Date(b.reservationTime)
                            )
                            .map((table) => (
                              <div
                                key={table.id}
                                draggable
                                onDragStart={(e) => {
                                  handleReservationDragStart(
                                    table.id,
                                    e.clientX,
                                    e.clientY
                                  );
                                  // Set drag effect
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    table.id
                                  );
                                }}
                                onDrag={(e) => {
                                  handleReservationDragMove(
                                    e.clientX,
                                    e.clientY
                                  );
                                }}
                                onDragEnd={(e) => {
                                  handleReservationDragEnd(
                                    e.clientX,
                                    e.clientY
                                  );
                                }}
                                className={`cursor-move transition-opacity ${
                                  draggedReservation?.id === table.id
                                    ? "opacity-50"
                                    : ""
                                }`}
                              >
                                <ReservationCard
                                  table={table}
                                  onSelect={setSelectedId}
                                  formatTime={formatTime}
                                />
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-600">
                          💡 Tip: Drag reservation cards to transfer them to
                          other tables on the floor plan
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              {/* Tenant-only Reservation Controls */}
              {userRole === "tenant" && selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Table T{selectedTable.tableNumber} Reservation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Reservation Name Input */}
                    <div>
                      <Label
                        htmlFor="reservationName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Guest Name
                      </Label>
                      <Input
                        id="reservationName"
                        type="text"
                        placeholder="Enter guest name"
                        value={selectedTable.reservationName || ""}
                        onChange={handleReservationNameChange}
                        className="mt-1"
                      />
                    </div>

                    {/* Table Status Controls */}
                    <div>
                      <p className="text-sm text-muted-foreground font-bold mb-2">
                        Table Status:
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {tableStatuses.map((status) => (
                          <Button
                            key={status.id}
                            onClick={() => changeTableStatus(status.id)}
                            variant={
                              selectedTable.status === status.id
                                ? "default"
                                : "outline"
                            }
                            className={cn({
                              "border-gray-500":
                                selectedTable.status === status.id,
                            })}
                            size="sm"
                          >
                            {status.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Modern Reservation Cards*/}

                    {/* Reservation Time */}
                    {selectedTable.status === "reserved" && (
                      <div>
                        <TimePicker
                          title="Set Reservation time"
                          buttonText="Confirm Reservation"
                          onConfirm={setReservationTime}
                          defaultTime={
                            tables.filter(
                              (table) => table.id === selectedTable.id
                            )[0]?.reservationTime
                          }
                        />
                      </div>
                    )}

                    <Separator className="bg-gray-700" />

                    {/* Table Info */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Seats: {selectedTable.seats}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Position: ({Math.round(selectedTable.x)},{" "}
                          {Math.round(selectedTable.y)})
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin-only Selected Table Controls */}
              {userRole === "admin" && selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Table T{selectedTable.tableNumber} Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Separator className="bg-gray-700" />

                    {/* Table Info */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Seats: {selectedTable.seats}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Position: ({Math.round(selectedTable.x)},{" "}
                          {Math.round(selectedTable.y)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        <span>
                          Size: {selectedTable.width}×{selectedTable.height}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created: {formatTime(selectedTable.createdAt)}{" "}
                          {formatDate(selectedTable.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin-only Table Types */}
              {userRole === "admin" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Tables</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Drag to add to floor plan
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tableTypes.map((tableType) => (
                        <Card
                          key={tableType.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, tableType)}
                          className="cursor-move"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">
                                  {tableType.name}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {tableType.seats} seats
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GripVertical className="h-3 w-3" />
                                    {tableType.width}×{tableType.height}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <img
                                  src={tableType.svgPath}
                                  alt={tableType.name}
                                  className="w-12 h-8 object-contain mb-1"
                                />
                                <p className="text-xs text-gray-500">
                                  Drag to add
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    Help
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      {userRole === "admin" ? (
                        <>
                          <li>
                            Drag tables from the sidebar to the floor plan
                          </li>
                          <li>Click on a table to select it</li>
                          <li>Drag tables to reposition them</li>
                          <li>Use floor controls to manage multiple tables</li>
                          <li>Delete or duplicate selected tables</li>
                          <li>View table information and creation details</li>
                        </>
                      ) : (
                        <>
                          <li>Click on a table to select it for reservation</li>
                          <li>Enter guest name for reservations</li>
                          <li>Set table status: Free, Occupied, or Reserved</li>
                          <li>Set reservation times for reserved tables</li>
                          <li>View upcoming reservations in modern cards</li>
                          <li>
                            Drag reservation pins to swap table reservations
                          </li>
                        </>
                      )}
                      <li>
                        Toggle sidebar visibility with the button in the
                        top-right corner
                      </li>
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </div>
  );
};

export default AppSidebar;
