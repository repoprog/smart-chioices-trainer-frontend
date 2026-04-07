import { NavLink, Outlet } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  [
    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
  ].join(' ')

export function Layout() {
  return (
    <div className="flex min-h-svh bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Smart Choices
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
            Portal decyzyjny
          </p>
        </div>
    
<nav className="flex flex-col gap-1 p-3" aria-label="Moduły">
  <NavLink to="/app/tabela" className={navLinkClass}>
    Tabela Decyzyjna
  </NavLink>
  <NavLink to="/app/drzewo" className={navLinkClass}>
    Drzewo Decyzyjne
  </NavLink>
</nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
