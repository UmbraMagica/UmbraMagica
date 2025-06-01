import { Moon, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoonPhaseProps {
  gameDate: string;
}

export function MoonPhase({ gameDate }: MoonPhaseProps) {
  // Úplňky v roce 1926
  const fullMoons1926 = [
    "1926-01-06",
    "1926-02-05", 
    "1926-03-07",
    "1926-04-05",
    "1926-05-05",
    "1926-06-04",
    "1926-07-03",
    "1926-08-02",
    "1926-08-31", // modrý úplněk
    "1926-09-30",
    "1926-10-30", 
    "1926-11-28",
    "1926-12-28"
  ];

  // Novy v roce 1926
  const newMoons1926 = [
    "1926-01-14",
    "1926-02-12",
    "1926-03-14", 
    "1926-04-12",
    "1926-05-11",
    "1926-06-10",
    "1926-07-10",
    "1926-08-08",
    "1926-09-06",
    "1926-10-06",
    "1926-11-05",
    "1926-12-05"
  ];

  function calculateMoonPhase(currentDate: string): { phase: string; description: string; icon: JSX.Element } {
    const current = new Date(currentDate);
    
    // Najdi nejbližší úplněk a nov
    let closestFullMoon = null;
    let closestNewMoon = null;
    let minFullMoonDiff = Infinity;
    let minNewMoonDiff = Infinity;

    for (const fullMoon of fullMoons1926) {
      const fullMoonDate = new Date(fullMoon);
      const diff = Math.abs(current.getTime() - fullMoonDate.getTime());
      if (diff < minFullMoonDiff) {
        minFullMoonDiff = diff;
        closestFullMoon = fullMoonDate;
      }
    }

    for (const newMoon of newMoons1926) {
      const newMoonDate = new Date(newMoon);
      const diff = Math.abs(current.getTime() - newMoonDate.getTime());
      if (diff < minNewMoonDiff) {
        minNewMoonDiff = diff;
        closestNewMoon = newMoonDate;
      }
    }

    const daysDiffFullMoon = Math.round(minFullMoonDiff / (1000 * 60 * 60 * 24));
    const daysDiffNewMoon = Math.round(minNewMoonDiff / (1000 * 60 * 60 * 24));

    // Určí fázi podle nejbližší události
    if (daysDiffFullMoon === 0) {
      return {
        phase: "Úplněk",
        description: "Měsíc je v úplňku",
        icon: <Circle className="h-6 w-6 fill-yellow-300 text-yellow-300" />
      };
    } else if (daysDiffNewMoon === 0) {
      return {
        phase: "Nov",
        description: "Měsíc je v novu",
        icon: <Circle className="h-6 w-6 text-gray-600" />
      };
    } else if (daysDiffFullMoon < daysDiffNewMoon) {
      // Blíže k úplňku
      if (closestFullMoon && current < closestFullMoon) {
        // Dorůstající měsíc
        if (daysDiffFullMoon <= 7) {
          return {
            phase: "Dorůstající měsíc",
            description: `${daysDiffFullMoon} dní do úplňku`,
            icon: <div className="relative">
              <Circle className="h-6 w-6 text-gray-300" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="h-6 w-3 bg-yellow-300 rounded-l-full"></div>
              </div>
            </div>
          };
        } else {
          return {
            phase: "Mladý měsíc",
            description: `${daysDiffFullMoon} dní do úplňku`,
            icon: <div className="relative">
              <Circle className="h-6 w-6 text-gray-300" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="h-6 w-1 bg-yellow-300 rounded-l-full ml-1"></div>
              </div>
            </div>
          };
        }
      } else {
        // Ubývající měsíc
        if (daysDiffFullMoon <= 7) {
          return {
            phase: "Ubývající měsíc",
            description: `${daysDiffFullMoon} dní od úplňku`,
            icon: <div className="relative">
              <Circle className="h-6 w-6 text-gray-300" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="h-6 w-3 bg-yellow-300 rounded-r-full ml-3"></div>
              </div>
            </div>
          };
        } else {
          return {
            phase: "Starý měsíc",
            description: `${daysDiffFullMoon} dní od úplňku`,
            icon: <div className="relative">
              <Circle className="h-6 w-6 text-gray-300" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="h-6 w-1 bg-yellow-300 rounded-r-full ml-5"></div>
              </div>
            </div>
          };
        }
      }
    } else {
      // Blíže k novu
      if (closestNewMoon && current < closestNewMoon) {
        // Směřuje k novu (ubývající)
        return {
          phase: "Ubývající měsíc",
          description: `${daysDiffNewMoon} dní do novu`,
          icon: <div className="relative">
            <Circle className="h-6 w-6 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-6 w-1 bg-yellow-300 rounded-r-full ml-5"></div>
            </div>
          </div>
        };
      } else {
        // Po novu (dorůstající)
        return {
          phase: "Mladý měsíc",
          description: `${daysDiffNewMoon} dní od novu`,
          icon: <div className="relative">
            <Circle className="h-6 w-6 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-6 w-1 bg-yellow-300 rounded-l-full ml-1"></div>
            </div>
          </div>
        };
      }
    }
  }

  const moonData = calculateMoonPhase(gameDate);

  return (
    <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-200/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {moonData.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              {moonData.phase}
            </h3>
            <p className="text-xs text-muted-foreground">
              {moonData.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}