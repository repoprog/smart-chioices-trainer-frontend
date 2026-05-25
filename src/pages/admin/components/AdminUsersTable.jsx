import React, { memo, useMemo } from 'react';
import { Users, CheckCircle, Ban } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { TablePagination } from '../../../components/ui/TablePagination';


const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-4 w-[10%]"><div className="h-4 bg-muted rounded w-8"></div></td>
    <td className="p-4 w-[40%]"><div className="h-4 bg-muted rounded w-32"></div></td>
    <td className="p-4 w-[20%]"><div className="h-4 bg-muted rounded w-24"></div></td>
    <td className="p-4 w-[15%]"><div className="h-4 bg-muted rounded w-20"></div></td>
    <td className="p-4 w-[15%]"><div className="h-8 bg-muted rounded w-28 ml-auto"></div></td>
  </tr>
);

export const AdminUsersTable = memo(function AdminUsersTable({ users, isLoading, onToggleStatus, currentPage, totalPages, onPageChange }) {
  

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
  
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
  
    return 0; 
  });
  }, [users]); 
 

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Zarządzanie Użytkownikami</h2>
      </div>
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          {/* 3. ZMIANA: Dodano 'table-fixed' aby usztywnić kolumny */}
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                {/* 4. ZMIANA: Wymuszona szerokość dla poszczególnych kolumn w % */}
                <th className="px-4 py-3 font-medium w-[15%]">ID</th>
                <th className="px-4 py-3 font-medium w-[35%]">Użytkownik</th>
                <th className="px-4 py-3 font-medium w-[20%]">Utworzono</th>
                <th className="px-4 py-3 font-medium w-[15%]">Status</th>
                <th className="px-4 py-3 font-medium w-[15%] text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">Brak użytkowników do wyświetlenia.</td>
                </tr>
              ) : (
                /* ZMIANA: Iterujemy po NASZEJ posortowanej tablicy sortedUsers */
                sortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs truncate">
                      {user.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 truncate">
                      <div className="font-medium truncate">{user.name || user.email}</div>
                      {user.name && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'ADMIN' ? (
                        <Badge variant="primary">Admin</Badge>
                      ) : !user.isActive ? (
                        <Badge variant="danger">Zablokowany</Badge>
                      ) : (
                        <Badge variant="success">Aktywny</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* ZMIANA: Dodano 'w-[120px]' dla sztywnego przycisku (nie zmieni rozmiaru kolumny) */}
                      <Button
                        variant={!user.isActive ? 'emeraldOutline' : 'ghostDestructive'}
                        size="sm"
                        disabled={user.role === 'ADMIN'}
                        onClick={() => onToggleStatus(user)}
                        className="w-[110px] flex justify-center ml-auto shrink-0"
                      >
                        {!user.isActive ? <><CheckCircle className="w-4 h-4 mr-2" /> Odblokuj</> : <><Ban className="w-4 h-4 mr-2" /> Zablokuj</>}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          isLoading={isLoading} 
          onPageChange={onPageChange} 
        />
      </Card>
    </section>
  );
});