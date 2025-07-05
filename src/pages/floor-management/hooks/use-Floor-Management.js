import { useContext } from "react";
import { FloorManagementContext } from "../context/FloorManagementContext";

export const useFloorManagement = () => {
    const context = useContext(FloorManagementContext);
    if (!context) {
      throw new Error(
        "useFloorManagement must be used within a FloorManagementProvider"
      );
    }
    return context;
  };
  