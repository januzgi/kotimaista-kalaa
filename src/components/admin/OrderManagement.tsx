import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { OrdersList } from './OrdersList';

interface OrderManagementProps {
  fishermanProfile: {
    id: string;
    default_delivery_fee: number;
  };
}

export const OrderManagement = ({ fishermanProfile }: OrderManagementProps) => {
  const { newOrderCount } = useNotifications();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-dark mb-2">Tilaukset</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Hallitse saapuvia tilauksia ja vahvista ne asiakkaille
        </p>
      </div>

        <Tabs defaultValue="new" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new" className="text-xs sm:text-sm relative">
              Uudet
              {newOrderCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {newOrderCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs sm:text-sm">Vahvistetut</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Valmiit</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Perutut</TabsTrigger>
          </TabsList>

        <TabsContent value="new">
          <OrdersList 
            fishermanProfileId={fishermanProfile.id}
            status="NEW"
            defaultDeliveryFee={fishermanProfile.default_delivery_fee}
          />
        </TabsContent>

        <TabsContent value="confirmed">
          <OrdersList 
            fishermanProfileId={fishermanProfile.id}
            status="CONFIRMED"
            defaultDeliveryFee={fishermanProfile.default_delivery_fee}
          />
        </TabsContent>

        <TabsContent value="completed">
          <OrdersList 
            fishermanProfileId={fishermanProfile.id}
            status="COMPLETED"
            defaultDeliveryFee={fishermanProfile.default_delivery_fee}
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <OrdersList 
            fishermanProfileId={fishermanProfile.id}
            status="CANCELLED"
            defaultDeliveryFee={fishermanProfile.default_delivery_fee}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};