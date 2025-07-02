import { FloorManagementProvider } from "./context";
import { FloorCanvas } from "./components";
import AppSidebar from "./components/AppSidebar";
import { ToastContainer } from "react-toastify";
// import FloorCanvas from "./components/floor-canvas";

const FloorManagement = () => {
  return (
    <FloorManagementProvider>
      <div className="flex h-screen overflow-hidden font-roboto w-full bg-gray-50">
        <AppSidebar />
        <FloorCanvas />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="z-50"
        />
      </div>
    </FloorManagementProvider>
  );
};

export default FloorManagement;
