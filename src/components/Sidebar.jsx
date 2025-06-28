import React from "react";
import { useFloorManagement } from "../context/FloorManagementContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const Sidebar = () => {
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
  } = useFloorManagement();

  const selectedTable = getSelectedTable();

  // Handle drag start from sidebar
  const handleDragStart = (e, tableType) => {
    dragUrl.current = tableType;
  };

  return (
    <div
      className={`w-80 bg-gray-900 border-l border-gray-700 text-gray-300 overflow-y-auto fixed right-0 top-0 bottom-0 transition-transform duration-300 z-50 ${
        sidebarVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-200">Floor Management</h2>
          <p className="text-sm text-gray-400">Manage your restaurant layout</p>
        </div>

        {/* Floor Controls */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-200 flex items-center gap-2">
              <GripVertical className="h-4 w-4" />
              Floor Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={clearAllTables}
              variant="destructive"
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Tables ({tables.length})
            </Button>

            {selectedId && (
              <div className="space-y-2">
                <Button
                  onClick={deleteTable}
                  variant="outline"
                  className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected Table
                </Button>
                <Button
                  onClick={duplicateTable}
                  variant="outline"
                  className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Selected Table
                </Button>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-gray-700">
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
                  {selectedTable ? `T${selectedTable.tableNumber}` : "None"}
                </Badge>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Table Status Summary */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-200">
              Table Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-gray-700">
                <div className="font-bold text-gray-200 text-lg">
                  {tables.filter((t) => t.status === "free").length}
                </div>
                <div className="text-xs text-gray-400">Free</div>
              </div>
              <div className="text-center p-2 rounded bg-gray-700">
                <div className="font-bold text-gray-200 text-lg">
                  {tables.filter((t) => t.status === "reserved").length}
                </div>
                <div className="text-xs text-gray-400">Reserved</div>
              </div>
              <div className="text-center p-2 rounded bg-gray-700">
                <div className="font-bold text-gray-200 text-lg">
                  {tables.filter((t) => t.status === "occupied").length}
                </div>
                <div className="text-xs text-gray-400">Occupied</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Table Controls */}
        {selectedTable && (
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Table T{selectedTable.tableNumber} Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Table Status Controls */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Table Status:</p>
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
                      className={`justify-start bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 ${
                        selectedTable.status === status.id
                          ? "border-gray-500"
                          : ""
                      }`}
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
                  <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reservation Time:
                  </p>
                  <Input
                    type="time"
                    value={
                      selectedTable.reservationTime
                        ? new Date(
                            selectedTable.reservationTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : ""
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      const date = new Date();
                      date.setHours(parseInt(hours, 10));
                      date.setMinutes(parseInt(minutes, 10));
                      date.setSeconds(0);
                      setReservationTime(date.toISOString());
                    }}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                  <p className="text-xs text-gray-500">
                    {selectedTable.reservationTime
                      ? `Reserved for: ${formatTime(
                          selectedTable.reservationTime
                        )}`
                      : "Set reservation time"}
                  </p>
                </div>
              )}

              <Separator className="bg-gray-700" />

              {/* Table Info */}
              <div className="space-y-1 text-sm text-gray-400">
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
        {tables.filter((t) => t.status === "reserved" && t.reservationTime)
          .length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming Reservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {tables
                    .filter((t) => t.status === "reserved" && t.reservationTime)
                    .sort(
                      (a, b) =>
                        new Date(a.reservationTime) -
                        new Date(b.reservationTime)
                    )
                    .map((table) => (
                      <Card
                        key={table.id}
                        className={`cursor-pointer transition-colors ${
                          table.id === selectedId
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                        }`}
                        onClick={() => setSelectedId(table.id)}
                      >
                        <CardContent className="p-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-gray-700 text-gray-300 border-gray-600"
                              >
                                T{table.tableNumber}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                ({table.seats} seats)
                              </span>
                            </div>
                            <Badge className="bg-gray-600 text-gray-200">
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
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-200">
              Add Tables
            </CardTitle>
            <p className="text-sm text-gray-400">Drag to add to floor plan</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tableTypes.map((tableType) => (
                <Card
                  key={tableType.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tableType)}
                  className="cursor-move bg-gray-700 border-gray-600 hover:bg-gray-600 transition-all duration-200"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-200">
                          {tableType.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
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
                        <p className="text-xs text-gray-500">Drag to add</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-200 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <ul className="text-sm text-gray-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Drag tables from the sidebar to the floor plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Click on a table to select it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Drag tables to reposition them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <div>
                    <span>Set table status:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span>Free (Available)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span>Occupied (In use)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span>Reserved (Booked)</span>
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Set reservation times for reserved tables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Use floor controls to manage multiple tables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>
                    Toggle sidebar visibility with the button in the top-right
                    corner
                  </span>
                </li>
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">
                Diniiz Floor Management
              </p>
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
              <Badge
                variant="outline"
                className="bg-gray-700 text-gray-400 border-gray-600 text-xs"
              >
                v1.0.0
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sidebar;
