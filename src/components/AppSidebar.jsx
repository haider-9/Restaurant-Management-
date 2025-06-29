import React from "react";
import { useFloorManagement } from "../context/FloorManagementContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Copy,
  Clock,
  Users,
  MapPin,
  Calendar,
  HelpCircle,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarTrigger } from "./ui/sidebar";
import TimePicker from "./ui/time-picker";

const AppSidebar = () => {
  const {
    tables,
    selectedId,
    sidebarVisible,
    tableTypes,
    tableStatuses,
    dragUrl,
    setSelectedId,
    deleteTable,
    clearAllTables,
    duplicateTable,
    changeTableStatus,
    setReservationTime,
    formatTime,
    formatDate,
    getSelectedTable,
    toggleSidebar,
  } = useFloorManagement();

  const selectedTable = getSelectedTable();

  const handleDragStart = (e, tableType) => {
    dragUrl.current = tableType;
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

              {/* Floor Controls */}
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    Floor Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={clearAllTables} className="w-full" size="sm">
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

              {/* Table Status Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Table Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {tableStatuses.map((status) => (
                      <div
                        key={status.id}
                        className="text-center p-2 rounded-lg"
                        style={{ backgroundColor: status.color }}
                      >
                        <div className="font-bold text-2xl font-mono">
                          {tables.filter((t) => t.status === status.id).length}
                        </div>
                        <div className="text-xs">{status.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Table Controls */}
              {selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Table T{selectedTable.tableNumber} Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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

              {/* Upcoming Reservations */}
              {tables.filter(
                (t) => t.status === "reserved" && t.reservationTime
              ).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Upcoming Reservations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {tables
                          .filter(
                            (t) => t.status === "reserved" && t.reservationTime
                          )
                          .sort(
                            (a, b) =>
                              new Date(a.reservationTime) -
                              new Date(b.reservationTime)
                          )
                          .map((table) => (
                            <Card
                              key={table.id}
                              className="cursor-pointer py-3 px-0"
                              onClick={() => setSelectedId(table.id)}
                            >
                              <CardContent>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      T{table.tableNumber}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      ({table.seats} seats)
                                    </span>
                                  </div>
                                  <Badge>
                                    {formatTime(table.reservationTime)}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Table Types */}
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
                              <h4 className="font-medium">{tableType.name}</h4>
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
                              <div className="w-10 h-6 rounded bg-gray-600 flex items-center justify-center text-gray-200 text-xs font-bold mb-1">
                                {tableType.seats}
                              </div>
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
                      <li>Drag tables from the sidebar to the floor plan</li>
                      <li>Click on a table to select it</li>
                      <li>Drag tables to reposition them</li>
                      <li>
                        Set table status:
                        <ul className="list-decimal list-inside ml-5 mt-1 space-y-1">
                          <li>Free (Available)</li>
                          <li>Occupied (In use)</li>
                          <li>Reserved (Booked)</li>
                        </ul>
                      </li>
                      <li>Set reservation times for reserved tables</li>
                      <li>Use floor controls to manage multiple tables</li>
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
