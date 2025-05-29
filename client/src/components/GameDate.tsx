import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function GameDate() {
  const currentDate = new Date();
  const gameDateString = `${currentDate.getDate()}. ${currentDate.toLocaleDateString('cs-CZ', { month: 'long' })} 1926`;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Calendar className="text-accent mr-3 h-5 w-5" />
          Herní datum
        </h3>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent mb-2">
            {gameDateString}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}