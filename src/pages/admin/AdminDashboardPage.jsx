import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { getSystemStats, getUsersPage, getActiveSharesPage, toggleUserStatus, revokeShare } from '../../api/adminApi';
import { useToastStore } from '../../store/useToastStore';

// Nasze nowe, wydzielone komponenty
import { AdminStatsCards } from './components/AdminStatsCards';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminSharesTable } from './components/AdminSharesTable';

const PAGE_SIZE = 10;

export function AdminDashboardPage() { // Zmiana na 'export function' ze spójnością z resztą aplikacji (może wymagać zmiany w App.jsx na { AdminDashboardPage })
  const addToast = useToastStore(state => state.addToast);

  // STANY DANYCH
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalTables: 0, totalTrees: 0, activeShareLinks: 0 });
  const [usersData, setUsersData] = useState({ content: [], totalPages: 0 });
  const [sharesData, setSharesData] = useState({ content: [], totalPages: 0 });
  
  // STANY PAGINACJI (Spring Data liczy strony od 0)
  const [userPage, setUserPage] = useState(0);
  const [sharePage, setSharePage] = useState(0);

  // STANY ŁADOWANIA
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingShares, setIsLoadingShares] = useState(true);

  // POBIERANIE DANYCH
  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await getSystemStats();
      setStats({
        totalUsers: data?.totalUsers || 0,
        totalProjects: data?.totalProjects || 0,
        totalTables: data?.projectsByTypeTable || 0, 
        totalTrees: data?.projectsByTypeTree || 0,
        activeShareLinks: data?.activeShareLinks || 0
      });
    } catch (err) {
      addToast("Błąd pobierania statystyk", "error");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async (pageIndex) => {
    try {
      setIsLoadingUsers(true);
      const data = await getUsersPage(pageIndex, PAGE_SIZE);
      setUsersData({ content: data?.content || [], totalPages: data?.totalPages || 0 });
    } catch (err) {
      addToast("Błąd pobierania użytkowników", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadShares = async (pageIndex) => {
    try {
      setIsLoadingShares(true);
      const data = await getActiveSharesPage(pageIndex, PAGE_SIZE);
      setSharesData({ content: data?.content || [], totalPages: data?.totalPages || 0 });
    } catch (err) {
      addToast("Błąd pobierania udostępnień", "error");
    } finally {
      setIsLoadingShares(false);
    }
  };

  // EFEKTY POBIERAJĄCE DANE (reagują na zmianę strony)
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadUsers(userPage); }, [userPage]);
  useEffect(() => { loadShares(sharePage); }, [sharePage]);

  // AKCJE BIZNESOWE
  const handleToggleUserStatus = async (user) => {
    if (user.role === 'ADMIN') return;
    try {
      await toggleUserStatus(user.id);
      addToast(`Status użytkownika ${user.email} został zmieniony.`, "success");
      loadUsers(userPage); // Odśwież obecną stronę
    } catch (err) {
      addToast("Błąd podczas zmiany statusu użytkownika", "error");
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await revokeShare(shareId);
      addToast("Link udostępniający został usunięty.", "success");
    
      setStats(prev => ({ 
        ...prev, 
        activeShareLinks: Math.max(0, prev.activeShareLinks - 1) 
      }));
    
      loadShares(sharePage); // Odświeżamy tylko tabelę, aby zniknął usunięty wiersz
    } catch (err) {
      addToast("Błąd podczas usuwania linku", "error");
    }
  };
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Panel Administratora</h1>
      </div>

      <AdminStatsCards 
        stats={stats} 
        isLoading={isLoadingStats} 
      />

      <div className="grid grid-cols-1 gap-10">
        <AdminUsersTable 
          users={usersData.content} 
          isLoading={isLoadingUsers} 
          onToggleStatus={handleToggleUserStatus}
          currentPage={userPage}
          totalPages={usersData.totalPages}
          onPageChange={setUserPage}
        />

        <AdminSharesTable 
          shares={sharesData.content} 
          isLoading={isLoadingShares} 
          onRevoke={handleRevokeShare}
          currentPage={sharePage}
          totalPages={sharesData.totalPages}
          onPageChange={setSharePage}
        />
      </div>
    </div>
  );
}