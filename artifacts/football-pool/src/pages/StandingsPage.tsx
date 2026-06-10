import { usePoolState } from '@/hooks/usePoolState';
import { Standing } from '@/lib/poolLogic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StandingsPage() {
  const { standingsA, standingsB } = usePoolState();

  const renderTable = (standings: Standing[], pool: string) => {
    return (
      <div className="mb-8 bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-primary/5 border-b p-4">
          <h2 className="font-display text-2xl font-bold text-primary">Pool {pool} Standings</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">Pos</TableHead>
                <TableHead className="font-bold">Team</TableHead>
                <TableHead className="text-center w-12" title="Played">P</TableHead>
                <TableHead className="text-center w-12" title="Won">W</TableHead>
                <TableHead className="text-center w-12" title="Drawn">D</TableHead>
                <TableHead className="text-center w-12" title="Lost">L</TableHead>
                <TableHead className="text-center w-12" title="Goals For">GF</TableHead>
                <TableHead className="text-center w-12" title="Goals Against">GA</TableHead>
                <TableHead className="text-center w-16 font-bold" title="Goal Difference">GD</TableHead>
                <TableHead className="text-center w-16 font-display text-lg text-primary">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s, idx) => {
                const isFirst = idx === 0;
                return (
                  <TableRow 
                    key={s.teamId} 
                    className={`transition-colors hover:bg-muted/50 ${isFirst ? 'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary' : ''}`}
                    data-testid={`row-standing-${s.teamId}`}
                  >
                    <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        {s.teamName}
                        {isFirst && <Badge variant="default" className="bg-primary hover:bg-primary text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">🏆 Finalist</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{s.played}</TableCell>
                    <TableCell className="text-center text-green-600 dark:text-green-400">{s.won}</TableCell>
                    <TableCell className="text-center text-yellow-600 dark:text-yellow-400">{s.drawn}</TableCell>
                    <TableCell className="text-center text-red-600 dark:text-red-400">{s.lost}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{s.gf}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{s.ga}</TableCell>
                    <TableCell className={`text-center font-bold ${s.gd > 0 ? 'text-primary' : s.gd < 0 ? 'text-destructive' : ''}`}>
                      {s.gd > 0 ? `+${s.gd}` : s.gd}
                    </TableCell>
                    <TableCell className="text-center font-display text-xl text-primary">{s.points}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Points Table</h1>
        <p className="text-muted-foreground">Live standings automatically updated based on match results.</p>
      </div>
      
      {renderTable(standingsA, 'A')}
      {renderTable(standingsB, 'B')}
    </div>
  );
}
