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
  Clock,
  Users,
  MapPin,
  UserCheck,
  Shield,
  User,
  Sidebar,
  SidebarClose,
  Square,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TimePicker from "./time-picker";
import { useFloorManagement } from "../hooks/use-Floor-Management";
import { floorElements, tableStatuses, tableTypes } from "../constants";

const ReservationCard = ({
  table,
  onSelect,
  formatTime,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow duration-200"
      draggable
      onDragStart={(e) => onDragStart(table.id, e)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(table.id)}
    >
      <div className="w-full h-px bg-gray-200 -mt-4 mb-4"></div>
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
      <div className="w-full h-px bg-gray-200 mt-4 -mb-4"></div>
    </div>
  );
};

const AppSidebar = () => {
  const {
    sidebarVisible,
    dragUrl,
    userRole,
    drawingMode,
    circleDrawingMode,
    setSelectedId,
    changeTableStatus,
    setReservationTime,
    setReservationName,
    formatTime,
    getSelectedTable,
    toggleSidebar,
    setUserRole,
    setDrawingMode,
    setCircleDrawingMode,
    elements,
  } = useFloorManagement();

  const selectedTable = getSelectedTable();

  const tables = elements.filter((element) => element.type === "table");

  const handleDragStart = (e, tableType) => {
    if (userRole !== "admin") return;
    dragUrl.current = tableType;
  };

  const handleRoleChange = (role) => {
    setUserRole(role);
  };

  const handleReservationNameChange = (e) => {
    if (selectedTable && selectedTable.type === "table") {
      setReservationName(selectedTable.id, e.target.value);
    }
  };

  // Handle reservation card drag start
  const handleReservationDragStart = (tableId, e) => {
    const table = tables.find((t) => t.id === tableId);
    if (table && table.type === "table") {
      const reservationData = {
        id: tableId,
        reservationName: table.reservationName,
        reservationTime: table.reservationTime,
        seats: table.seats,
      };

      // Set drag data
      e.dataTransfer.setData("text/plain", JSON.stringify(reservationData));
      e.dataTransfer.effectAllowed = "move";

      // Set dragged reservation in canvas
      if (window.setDraggedReservation) {
        window.setDraggedReservation(reservationData);
      }
    }
  };

  // Handle reservation card drag end
  const handleReservationDragEnd = () => {
    // Clear dragged reservation
    if (window.setDraggedReservation) {
      window.setDraggedReservation(null);
    }
  };

  // New: Drawing mode handlers for SVG icons
  const handleBarDrawClick = () => {
    if (circleDrawingMode) setCircleDrawingMode(false);
    setDrawingMode(!drawingMode);
  };

  const handleCircleDrawClick = () => {
    if (drawingMode) setDrawingMode(false);
    setCircleDrawingMode(!circleDrawingMode);
  };

  // Filter tables to only show actual tables (not doors or other elements)
  const actualTables = tables.filter((table) => table.type === "table");
  const reservedTables = actualTables.filter(
    (t) => t.status === "reserved" && t.reservationTime
  );

  return (
    <>
      {/* Sidebar Toggle Button */}
      <Button
        variant="icon"
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
      >
        {sidebarVisible ? (
          <SidebarClose className="h-4 w-4" />
        ) : (
          <Sidebar className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out",
          sidebarVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
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
                      <Shield className="h-4 w-4" />
                      Admin
                    </SelectItem>
                    <SelectItem value="tenant">
                      <UserCheck className="h-4 w-4" />
                      Tenant
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-xs text-muted-foreground">
                  Current role: <Badge variant="outline">{userRole}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Reservations */}
            {userRole === "tenant" && reservedTables.length > 0 && (
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
                      {reservedTables
                        .sort(
                          (a, b) =>
                            new Date(a.reservationTime) -
                            new Date(b.reservationTime)
                        )
                        .map((table) => (
                          <ReservationCard
                            key={table.id}
                            table={table}
                            onSelect={setSelectedId}
                            formatTime={formatTime}
                            onDragStart={handleReservationDragStart}
                            onDragEnd={handleReservationDragEnd}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-600">
                      💡 Tip: Drag reservation cards to transfer them to other
                      tables on the floor plan
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tenant-only Reservation Controls */}
            {userRole === "tenant" &&
              selectedTable &&
              selectedTable.type === "table" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Table T{selectedTable.tableNumber} Reservation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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

                    {selectedTable.status === "reserved" && (
                      <div>
                        <TimePicker
                          title="Set Reservation time"
                          buttonText="Confirm Reservation"
                          onConfirm={setReservationTime}
                          defaultTime={
                            actualTables.filter(
                              (table) => table.id === selectedTable.id
                            )[0]?.reservationTime
                          }
                        />
                      </div>
                    )}

                    <Separator className="bg-gray-700" />

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

            {/* Admin-only Floor Elements */}
            {userRole === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle>Floor Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline gap-2">
                    {floorElements.map((el) => (
                      <div key={el.id} className="">
                        {el.path.endsWith('.svg') ? (
                          <svg
                            draggable
                            onDragStart={(e) => handleDragStart(e, el)}
                            width={el.width}
                            height={el.height}
                            className="object-contain"
                          >
                            <image href={el.path} width={el.width} height={el.height} />
                          </svg>
                        ) : (
                          <img
                            draggable
                            onDragStart={(e) => handleDragStart(e, el)}
                            height={el.height}
                            width={el.width}
                            src={el.path}
                            alt={el.name}
                            className="object-contain"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {/* Bar SVG as button */}
                    <div
                      className="w-1/2 flex flex-col items-center cursor-pointer"
                      onClick={handleBarDrawClick}
                      title={drawingMode ? "Stop Drawing Bar" : "Draw Bar"}
                    >
                      <svg
                        width="112"
                        height="48"
                        className="h-12 w-28 object-contain mb-1"
                      >
                        <image href="/Bar.svg" width="112" height="48" />
                      </svg>
                      <span className="text-xs font-medium">
                        {drawingMode ? "Stop Drawing" : "Draw Bar"}
                      </span>
                    </div>
                    {/* Circle SVG as button */}
                    <div
                      className="w-1/2 flex flex-col items-center cursor-pointer"
                      onClick={handleCircleDrawClick}
                      title={
                        circleDrawingMode
                          ? "Stop Drawing Circle"
                          : "Draw Circle"
                      }
                    >
                      <svg
                        width="48"
                        height="48"
                        className="h-12 w-12 object-contain mb-1"
                      >
                        <image href="/circle.svg" width="48" height="48" />
                      </svg>
                      <span className="text-xs font-medium">
                        {circleDrawingMode ? "Stop Drawing" : "Draw Circle"}
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
                  <CardTitle>Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 flex flex-wrap gap-4">
                    {tableTypes.map((tableType) => (
                      <div
                        key={tableType.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tableType)}
                        className="cursor-move"
                      >
                        {tableType.svgPath.endsWith('.svg') ? (
                          <svg
                            width="88"
                            height="88"
                            className="w-22 h-22 object-contain mb-1"
                          >
                            <image href={tableType.svgPath} width="88" height="88" />
                          </svg>
                        ) : (
                          <img
                            src={tableType.svgPath}
                            alt={tableType.name}
                            className="w-22 h-22 object-contain mb-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default AppSidebar;
