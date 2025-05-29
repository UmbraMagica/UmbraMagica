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
          <p className="text-sm text-muted-foreground">
            Kouzelný svět v roce 1926
          </p>
          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Herní rok je fixní, ale den a měsíc odpovídají současnosti
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}