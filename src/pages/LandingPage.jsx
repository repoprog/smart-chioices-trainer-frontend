import React from 'react';

// Ikonki (możesz użyć 'heroicons' lub wkleić SVG, dla uproszczenia tu tekstowe)
const IconChart = () => <span className="text-xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
</svg>
</span>;
const IconTree = () => <span className="text-xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-branch-icon lucide-git-branch"><path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/></svg>
</span>;
const IconZap = () => <span className="text-xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
</svg>
</span>;


const IconFilter = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white stroke-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
);

const IconSliders = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white stroke-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12h9" />
    </svg>
);

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-[#f2f2f2] font-sans selection:bg-purple-500/30">
            {/* Header / Nawigacja */}
            <header className="fixed top-0 left-1/2 -translate-x-1/2 mt-6 z-50">
                <nav className="flex items-center gap-1.5 px-4 py-2 border border-white/5 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_20px_-10px_rgba(139,92,246,0.3)]">
                    <span className="font-bold text-sm tracking-tight text-white/90 mr-4">Decidely.</span>
                    <a href="#features" className="text-white/70 text-[12px] font-medium px-2.5 py-1 hover:text-white transition-colors">Cechy</a>
                    <a href="#how-it-works" className="text-white/70 text-[12px] font-medium px-2.5 py-1 hover:text-white transition-colors">Jak to Działa?</a>
                    <a href="#cases" className="text-white/70 text-[12px] font-medium px-2.5 py-1 hover:text-white transition-colors">Przykłady</a>
                    <a href="/app" className="inline-flex items-center gap-1.5 ml-4 px-3.5 py-1.5 border-none rounded-full bg-purple-500 text-white text-[12px] font-semibold cursor-pointer transition-all hover:bg-purple-600 hover:shadow-[0_0_20px_0_rgba(139,92,246,0.2)]">
                        Rozpocznij (Free)
                    </a>
                </nav>
            </header>

            {/* 1. SEKCJA HERO */}
            <section className="pt-40 pb-20 px-6 text-center max-w-[1200px] mx-auto">
                <h1 className="m-0 text-7xl font-extrabold tracking-[-3.5px] leading-[1] text-white">
                    Podejmuj Trafne Decyzje <br />
                    Bez Zgadywania
                </h1>
                <p className="mt-6 mb-10 max-w-[600px] mx-auto text-white/70 text-lg leading-relaxed">
                    Analizuj opcje i wybieraj najlepszą szybciej.
Wizualizuj scenariusze w tabeli lub drzewie decyzyjnym.
Metoda oparta na nauce, która eliminuje niepewność.
                </p>
                <div className="flex gap-4 justify-center">
                    <a href="/app/tabela" className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-cyan-400 text-black border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(34,211,238,0.2)] hover:bg-cyan-500">
                        Przeanalizuj Decyzję w Tabeli
                    </a>
                    <a href="/app/drzewo" className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-purple-500 text-white border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(139,92,246,0.2)] hover:bg-purple-600">
                        Zobacz Przykład Drzewa
                    </a>
                </div>
                
                {/* Pochylony Screenshot Applikacji (Możesz tu wstawić obrazek) */}
                {/* Pochylony Screenshot Applikacji */}
<div className="relative mt-20 w-full max-w-[1000px] mx-auto">
    {/* Kolorowa poświata pod obrazkiem */}
    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-cyan-400/30 blur-[80px] -z-10 rounded-full"></div>
    
    {/* Kontener z efektem 3D */}
    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm transition-transform duration-500 hover:[transform:perspective(1000px)_rotateX(0deg)_rotateY(0deg)_scale(1.02)] [transform:perspective(1000px)_rotateX(8deg)_rotateY(-12deg)_rotateZ(2deg)_scale(1.02)]">
        <img 
            src="/app-screenshot-tilted.png" 
            alt="Decision Tree Mockup" 
            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] block" 
        />
    </div>
</div>
            </section>

            {/* 2. SEKCJA FEATURES (Bento Grid) */}
           <section id="features" className="py-20 px-6 max-w-[1200px] mx-auto">
               <h2 className="text-center m-0 text-4xl font-extrabold tracking-[-1.5px] text-white">
    Ustrukturyzowane podejmowanie decyzji oparte na danych.
</h2>

<p className="text-center mt-4 text-sm text-white/60 max-w-[600px] mx-auto">
    Aplikacja modeluje proces decyzyjny przy użyciu wag i scenariuszy.
</p>
                
                {/* Siatka Bento: 3 kolumny na dużych ekranach, wysokość wiersza 250px */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">
                    
                    {/* Feature 1: Tabela - SZEROKI KAFELEK (zajmuje 2 kolumny) */}
                    <div className="md:col-span-2 p-8 flex flex-col justify-end gap-3 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)] hover:border-cyan-500/20">
                        <IconChart />
                        <h3 className="m-0 text-xl font-bold text-white/90">Tabela decyzyjna (Smart Choices)</h3>
                        <p className="m-0 text-[13px] text-white/60 leading-relaxed max-w-[500px]">
                            Multi-criteria decision analysis (MCDA) oparta na Smart Choices. Ważone kryteria prowadzą do jednoznacznego rankingu opcji.
                        </p>
                    </div>

                    {/* Feature 2: Drzewo - WYSOKI KAFELEK (zajmuje 2 wiersze w prawej kolumnie) */}
                    <div className="md:row-span-2 p-8 flex flex-col justify-end gap-3 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)] hover:border-purple-500/20">
                        <div className="mb-auto mt-2">
                             <IconTree />
                        </div>
                        <h3 className="m-0 text-xl font-bold text-white/90">Decision Tree</h3>
                        <p className="m-0 text-[13px] text-white/60 leading-relaxed">
                            Klasyczne drzewo decyzyjne z obliczaniem wartości oczekiwanej (EV). Uwzględnia prawdopodobieństwa i wyniki dla każdego scenariusza.
                        </p>
                    </div>

                    {/* Feature 3: Dominance Filtering - ZWYKŁY KAFELEK (lewy dół) */}
                    <div className="p-6 flex flex-col justify-end gap-2 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)] hover:border-red-500/20">
                        <IconFilter />
                        <h3 className="m-0 text-lg font-bold text-white/90">Dominance Filtering</h3>
                        <p className="m-0 text-[12px] text-white/60 leading-relaxed">
                            Eliminuj zdominowane (Pareto) alternatywy. Skup się tylko na opcjach, które mają realny sens.
                        </p>
                    </div>

                    {/* Feature 4: What-if Analysis - ZWYKŁY KAFELEK (środkowy dół) */}
                    <div className="p-6 flex flex-col justify-end gap-2 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)] hover:border-emerald-500/20">
                        <IconSliders />
                        <h3 className="m-0 text-lg font-bold text-white/90">What-if Analysis</h3>
                        <p className="m-0 text-[12px] text-white/60 leading-relaxed">
                            Zmianiaj wagi i prawdopodobieństwa w czasie rzeczywistym. Natychmiast zobacz wpływ na wynik końcowy.
                        </p>
                    </div>
                </div>
            </section>
            {/* 3. SEKCJA JAK TO DZIAŁA (Kroki) */}
<section id="how-it-works" className="py-24 px-6 max-w-[1000px] mx-auto">
    <h2 className="text-center m-0 text-3xl font-extrabold tracking-[-1px] text-white">
        Proces decyzyjny w 4 krokach
    </h2>
    <p className="text-center mt-4 mb-16 text-sm text-white/60 max-w-[600px] mx-auto">
        Przekształć chaos informacyjny w czystą, matematyczną odpowiedź.
    </p>

    <div className="relative border-l border-white/10 ml-4 md:ml-12 space-y-12 pb-4">
        
        {/* KROK 1 */}
        <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 border-purple-500 text-purple-400 font-bold text-sm shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                1
            </div>
            <h3 className="m-0 text-xl font-bold text-white/90">Zbuduj model problemu</h3>
            <p className="mt-2 text-[14px] text-white/60 leading-relaxed">
                Wprowadź swoje alternatywy (np. oferty pracy) oraz kryteria (np. pensja, czas dojazdu). W przypadku drzewa — połącz decyzje z węzłami niepewności (szansami).
            </p>
        </div>

        {/* KROK 2 */}
        <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 border-cyan-500 text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                2
            </div>
            <h3 className="m-0 text-xl font-bold text-white/90">Ustal wagi i wartości</h3>
            <p className="mt-2 text-[14px] text-white/60 leading-relaxed">
                Określ kierunek sortowania (czy wyższa pensja jest lepsza, czy gorsza?). Wpisz konkretne kwoty, procenty lub skorzystaj z gotowych, własnych ocen tekstowych (np. "wysoki standard" → 3 pkt).
            </p>
        </div>

        {/* KROK 3 */}
        <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 border-red-500 text-red-400 font-bold text-sm shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                3
            </div>
            <h3 className="m-0 text-xl font-bold text-white/90">Automatyczna eliminacja</h3>
            <p className="mt-2 text-[14px] text-white/60 leading-relaxed">
                Nasz algorytm skanuje tabelę i bezwzględnie filtruje (Pareto Dominance) opcje, które są we wszystkim gorsze od innych. Odpadają w przedbiegach, oszczędzając Twój czas.
            </p>
        </div>

        {/* KROK 4 */}
        <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 border-emerald-500 text-emerald-400 font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                4
            </div>
            <h3 className="m-0 text-xl font-bold text-white/90">Kompromisy i Wygrana</h3>
            <p className="mt-2 text-[14px] text-white/60 leading-relaxed">
                Dokonuj równej wymiany ("What-if"). Zwiększaj koszt kosztem jakości, aż zrównasz ze sobą kryteria i wyłonisz ostatecznego zwycięzcę, popartego twardymi danymi (lub najwyższym wskaźnikiem EV).
            </p>
        </div>

    </div>
</section>
            {/* 3. SEKCJA USE CASES (Krótko) */}
            <section id="cases" className="py-20 px-6 max-w-[1200px] mx-auto text-center">
                <h2 className="m-0 text-3xl font-bold text-white/90">Gdzie to ma zastosowanie</h2>
                <div className="mt-10 flex flex-wrap gap-3 justify-center">
                    {['Kupno Mieszkania', 'Wybór Stacku Technicznego', 'Planowanie Kariery', 'Wybór Samochodu', 'Priorytetyzacja Zadania'].map(item => (
                        <div key={item} className="px-4 py-1.5 border border-white/10 bg-black rounded-full text-[12px] font-medium text-white/70 transition-colors hover:text-white hover:border-white/30">
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. SEKCJA TECH STACK (Vite/React Flow/Zustand etc.) */}
            <section className="py-20 px-6 max-w-[1200px] mx-auto text-center border-t border-white/5 bg-[#010101]">
                <h4 className="m-0 text-xs font-semibold uppercase tracking-[2px] text-white/40">Zbudowany na nowoczesnym staku</h4>
                <div className="mt-10 flex justify-center gap-10 items-center opacity-60">
                    <span className="text-xl text-white/60 font-medium">React</span>
                    <span className="text-xl text-white/60 font-medium">Tailwind CSS</span>
                    <span className="text-xl text-white/60 font-medium">Vite</span>
                    <span className="text-xl text-white/60 font-medium">Zustand</span>
                    <span className="text-xl text-white/60 font-medium">React Flow</span>
                </div>
            </section>

          {/* 5. ALGORITHM SIGNATURE (Techniczne podsumowanie) */}
            <section className="pb-16 px-6 text-center bg-[#010101]">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="m-0 text-[11px] uppercase tracking-wider text-white/50 font-mono font-semibold">
                        Implements <span className="text-emerald-400">MCDA</span>, <span className="text-emerald-400">Expected Value Analysis</span> & <span className="text-emerald-400">Pareto Filtering</span>.
                    </p>
                </div>
            </section>

            {/* Footer (Krótko) */}
            <footer className="py-10 px-6 text-center text-[11px] text-white/30 border-t border-white/5">
                © {new Date().getFullYear()} Decidely.
            </footer>
        </div>
    );
}