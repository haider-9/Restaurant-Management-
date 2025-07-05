import React from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  UsersRound,
  UserPlus2,
  Calendar,
  FolderKanban,
  LayoutPanelTop,
  BookOpenCheck,
  LogOut,
  MessageSquare,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isFloorManagement = location.pathname.startsWith("/floor-management");

  const menuItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
      path: "/dashboard",
    },
    {
      label: "Booking",
      icon: <CalendarCheck2 size={20} strokeWidth={1.5} />,
      path: "/booking",
    },
    {
      label: "Manage Staff",
      icon: <UsersRound size={20} strokeWidth={1.5} />,
      path: "/manage-staff",
    },
    {
      label: "Assign Staff",
      icon: <UserPlus2 size={20} strokeWidth={1.5} />,
      path: "/assign-staff",
    },
    {
      label: "Manage Event",
      icon: <Calendar size={20} strokeWidth={1.5} />,
      path: "/manage-event",
    },
    {
      label: "Report",
      icon: <FolderKanban size={20} strokeWidth={1.5} />,
      path: "/report",
    },
    {
      label: "Floor Plan",
      icon: <LayoutPanelTop size={20} strokeWidth={1.5} />,
      path: "/floor-management",
    },
    {
      label: "Guest Book",
      icon: <BookOpenCheck size={20} strokeWidth={1.5} />,
      path: "/guestbook",
    },
    {
      label: "Chat",
      icon: <MessageSquare size={20} strokeWidth={1.5} />,
      path: "/chat",
    },
    {
      label: "Logout",
      icon: <LogOut size={20} strokeWidth={1.5} />,
      path: "/logout",
    },
  ];



  const SidebarContent = () => (
    <div className="h-screen bg-white flex flex-col items-start py-6 px-4">
      {/* Logo */}
      <div className="mb-10 w-full overflow-hidden size-20">
        <img
          src="/favicon.svg"
          alt="Logo"
          className="object-center size-full object-cover"
        />
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2.5 w-full">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center gap-3 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-left ${location.pathname === item.path
                ? "bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hide on floor-management route) */}
      {!isFloorManagement && (
        <div className="hidden md:block md:min-w-[250px] border-r shadow-sm">
          <SidebarContent />
        </div>
      )}

      {/* Sheet Sidebar (always show on floor-management route, trigger always visible) */}
      {(isFloorManagement || isMobile) && (
        <Sheet>
          <SheetTrigger className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md">
            <Menu size={24} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[250px]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default Sidebar;
