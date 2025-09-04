import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdersList } from './OrdersList';

interface OrderManagementProps {
  fishermanProfile: {
    id: string;
    default_delivery_fee: number;
  };
}

export const OrderManagement = ({ fishermanProfile }: OrderManagementProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark mb-2">Tilaukset</h2>
        <p className="text-muted-foreground">
          Hallitse saapuvia tilauksia ja vahvista ne asiakkaille
        </p>
      </div>

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">Uudet</TabsTrigger>
          <TabsTrigger value="confirmed">Vahvistetut</TabsTrigger>
          <TabsTrigger value="completed">Valmiit</TabsTrigger>
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
      </Tabs>
    </div>
  );
};