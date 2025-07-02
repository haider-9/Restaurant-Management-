import { CustomerManagement } from "./components/CustomerManagement";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <title>Deniiz - Guestbook</title>

      <CustomerManagement />
    </div>
  );
}
