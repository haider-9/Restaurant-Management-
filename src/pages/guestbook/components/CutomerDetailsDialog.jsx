import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CustomerDetailsDialog({ customer, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNo: "",
    tag: "",
    notes: "",
    allergies: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.name || "",
        email: customer.email || "",
        phoneNo: customer.phone || "",
        tag: customer.customerType || "",
        notes: customer.notes || "",
        allergies: customer.allergies || "",
      });
    }
  }, [customer]);

  if (!customer) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-5/6 sm:h-[78vh]">
          <div className="space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-2 py-4 bg-muted rounded-lg shadow-md">
                <div className="text-2xl font-semibold">
                  {customer.totalReservations}
                </div>
                <div className="text-sm text-muted-foreground">Total Reservations</div>
              </div>
              <div className="text-center p-2 py-4 bg-muted rounded-lg shadow-md">
                <div className="text-2xl font-semibold">
                  {customer.totalNoShows}
                </div>
                <div className="text-sm text-muted-foreground">Total No-Shows</div>
              </div>
              <div className="text-center p-2 py-4 bg-muted rounded-lg shadow-md">
                <div className="text-2xl font-semibold">
                  {customer.totalCancellations}
                </div>
                <div className="text-sm text-muted-foreground">Total Cancellation</div>
              </div>
            </div>

            {/* Form Section */}
            <div className="grid grid-cols-2 gap-4 *:space-y-2">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone No.</Label>
                <Input
                  id="phoneNo"
                  value={formData.phoneNo}
                  onChange={(e) => handleInputChange("phoneNo", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tag">Tag</Label>
                <Select
                  value={formData.tag}
                  onValueChange={(value) => handleInputChange("tag", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tag"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="well-spent">Well Spent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes and Allergies */}
            <div className="grid sm:grid-cols-2 *:space-y-2 gap-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Enter customer notes..."
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) =>
                    handleInputChange("allergies", e.target.value)
                  }
                  rows={3}
                  placeholder="Enter customer allergies..."
                />
              </div>
            </div>

            {/* History Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">History</h3>
              <div className="rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Party Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.history.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.partySize}</TableCell>

                        <TableCell>
                          <Badge
                            className={cn(
                              record.status === "Confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <FileText className="size-6 text-gray-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{customer.notes || "No notes"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="lg"
                                    className="size-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <img
                                      src="/virus.svg"
                                      alt="allergies"
                                      className="size-full"
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{customer.allergies || "No allergies"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 ">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-destructive-100 hover:bg-destructive-100/90 cursor-pointer"
              >
                Download CSV
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-violet hover:bg-violet/90 cursor-pointer"
              >
                Download PDF
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
