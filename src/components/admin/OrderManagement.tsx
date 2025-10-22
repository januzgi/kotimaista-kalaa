import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, CheckCircle2, XCircle, PackageCheck } from "lucide-react";
import { OrdersList } from "./OrdersList";
import { FishermanProfile } from "@/lib/types";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Props for the OrderManagement component
 */
interface OrderManagementProps {
  fishermanProfile: FishermanProfile | null;
}

/**
 * Order management component that provides tabbed interface for managing orders.
 *
 * Features:
 * - Tabbed interface for different order statuses (New, Confirmed, Completed, Cancelled)
 * - New order count badge for pending orders
 * - Integrates with notification system for real-time updates
 * - Passes fisherman profile data to order list components
 * - Responsive design with icon indicators
 *
 * The component serves as a wrapper that organizes order management by status
 * and provides visual indicators for pending actions.
 *
 * @param props - The component props
 * @returns The order management component with tabbed interface
 */
export const OrderManagement = ({ fishermanProfile }: OrderManagementProps) => {
  const { newOrderCount } = useNotifications();

  return (
    <div className="space-y-6 pt-12 max-w-[var(--admin-side-container-width)] mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
          Tilaukset
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Hallitse saapuvia tilauksia ja vahvista ne asiakkaille
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList className="grid grid-cols-1 mb-6 sm:grid-cols-4 w-[180px] sm:w-full mx-auto h-auto">
          <TabsTrigger
            value="new"
            className="text-xs sm:text-sm relative data-[state=active]:border-secondary border-b-2 rounded-b-none data-[state=active]:shadow-md"
          >
            <Inbox className="mr-1 h-4 w-4" />
            Uudet
            {newOrderCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
              >
                {newOrderCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="text-xs sm:text-sm data-[state=active]:border-secondary border-b-2 rounded-b-none data-[state=active]:shadow-md"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Vahvistetut
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="text-xs sm:text-sm data-[state=active]:border-secondary border-b-2 rounded-b-none data-[state=active]:shadow-md"
          >
            <PackageCheck className="mr-1 h-4 w-4" />
            Valmiit
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="text-xs sm:text-sm data-[state=active]:border-secondary border-b-2 rounded-b-none data-[state=active]:shadow-md"
          >
            <XCircle className="mr-1 h-4 w-4" />
            Perutut
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <OrdersList
            status="NEW"
            fishermanProfile={fishermanProfile}
            refreshTrigger={newOrderCount}
          />
        </TabsContent>

        <TabsContent value="confirmed">
          <OrdersList status="CONFIRMED" fishermanProfile={fishermanProfile} />
        </TabsContent>

        <TabsContent value="completed">
          <OrdersList status="COMPLETED" fishermanProfile={fishermanProfile} />
        </TabsContent>

        <TabsContent value="cancelled">
          <OrdersList status="CANCELLED" fishermanProfile={fishermanProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
