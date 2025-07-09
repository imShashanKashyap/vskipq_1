import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Medal,
  Clock,
  Trophy
} from "lucide-react";

interface LeaderboardEntry {
  id: number;
  userId: number;
  username?: string;
  restaurantId: number;
  ordersCompleted: number;
  averageOrderTime: number;
  fastestOrderTime?: number | null;
  points: number;
  level: number;
  dailyStreak: number;
  achievements: string[];
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightUserId?: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  entries, 
  highlightUserId 
}) => {
  // Format time from seconds to minutes:seconds
  const formatTime = (seconds: number | null | undefined): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Get medal for top 3 positions
  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-800" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-orange-500 text-white">
          <TableRow>
            <TableHead className="w-12 text-white">Rank</TableHead>
            <TableHead className="text-white">Chef</TableHead>
            <TableHead className="text-white text-right">Points</TableHead>
            <TableHead className="text-white text-right">Level</TableHead>
            <TableHead className="text-white text-right">Orders</TableHead>
            <TableHead className="text-white text-right">Avg Time</TableHead>
            <TableHead className="text-white text-right">Fastest</TableHead>
            <TableHead className="text-white text-right">Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow 
              key={entry.id}
              className={highlightUserId === entry.userId ? 'bg-orange-50' : undefined}
            >
              <TableCell className="font-medium flex items-center">
                {getMedal(index)}
                <span className={index < 3 ? 'ml-1' : ''}>{index + 1}</span>
              </TableCell>
              <TableCell>
                {entry.username || `Chef #${entry.userId}`}
              </TableCell>
              <TableCell className="text-right font-semibold">
                <div className="flex items-center justify-end">
                  <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                  {entry.points}
                </div>
              </TableCell>
              <TableCell className="text-right">{entry.level}</TableCell>
              <TableCell className="text-right">{entry.ordersCompleted}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end">
                  <Clock className="h-4 w-4 mr-1 text-blue-500" />
                  {formatTime(entry.averageOrderTime)}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatTime(entry.fastestOrderTime)}</TableCell>
              <TableCell className="text-right">{entry.dailyStreak} days</TableCell>
            </TableRow>
          ))}
          
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                No leaderboard data available yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;