import { SidebarProvider } from "./components/ui/sidebar";
import FloorManagement from "./pages/floor-management";

export default function App() {
  return (
    <SidebarProvider>
      <FloorManagement />
      </SidebarProvider>
  )
}