import { Routes, Route, Link } from "react-router";
import ChatPage from "@/pages/chat";
import Guestbook from "./pages/guestbook";
import {
  Book,
  BookDashed,
  LayoutDashboard,
  MessageCircleDashed,
} from "lucide-react";
import FloorManagement from "./pages/floor-management";
import Sidebar from "./components/WebSidebar";

const App = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="grow">
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
                <h1 className="font-bold text-2xl text-violet">
                  Deniiz Management System
                </h1>
                <p>Select a page from the navigation menu.</p>
                <nav className="grid gap-3 mt-4">
                  <Link
                    to="/chat"
                    className="hover:underline inline-flex items-center gap-2"
                  >
                    <MessageCircleDashed /> Chat Page
                  </Link>
                  <Link
                    to="/guestbook"
                    className="hover:underline inline-flex items-center gap-2"
                  >
                    <Book />
                    Guestbook
                  </Link>
                  <Link
                    to="/floor-management"
                    className="hover:underline inline-flex items-center gap-2"
                  >
                    <LayoutDashboard />
                    Floor Management
                  </Link>
                </nav>
              </div>
            }
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/guestbook" element={<Guestbook />} />
          <Route path="/floor-management" element={<FloorManagement />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
