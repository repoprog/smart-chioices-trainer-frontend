import React from 'react';
import { Link } from 'react-router-dom';
import { Table2, Network, Filter, SlidersHorizontal ,  } from 'lucide-react'; 

const features = [
    {
        id: 'table',
        title: 'Tabela decyzyjna (Smart Choices)',
        desc: 'Porównuj opcje według wielu kryteriów. Nadaj im wagi i zobacz, która wygrywa w rankingu.',
        Icon: Table2,
        wrapperClass: 'md:col-span-2 hover:border-cyan-500/20',
    },
    {
        id: 'tree',
        title: 'Drzewo decyzyjne',
        desc: 'Rozpisz scenariusze i ich prawdopodobieństwa. System pokaże najlepszą decyzję na podstawie wartości oczekiwanej (EV).',
        Icon: Network,
        wrapperClass: 'md:row-span-2 hover:border-purple-500/20',
        iconContainerClass: 'mb-auto mt-2'
    },
    {
        id: 'pareto',
        title: 'Filtrowanie dominacji (Pareto)',
        desc: 'Automatycznie usuwa opcje, które są wyraźnie gorsze. Zostają tylko te, które warto rozważyć.',
        Icon: Filter,
        wrapperClass: 'hover:border-red-500/20',
    },
    {
        id: 'whatif',
        title: 'Symulacje (What-if)',
        desc: 'Zmieniaj wagi i prawdopodobieństwa i od razu zobacz wpływ na wynik — bez ręcznego przeliczania.',
        Icon: SlidersHorizontal,
        wrapperClass: 'hover:border-emerald-500/20',
    }
];

const steps = [
    {
        num: 1,
        title: "Zbuduj model problemu",
        desc: "Wprowadź swoje alternatywy (np. oferty pracy) oraz kryteria (np. pensja, czas dojazdu). W przypadku drzewa — połącz decyzje z węzłami niepewności (szansami).",
        colorStyle: "border-purple-500 !text-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
    },
    {
        num: 2,
        title: "Ustal wagi i wartości",
        desc: "Określ kierunek sortowania (czy wyższa pensja jest lepsza, czy gorsza?). Wpisz konkretne kwoty, procenty lub skorzystaj z gotowych, własnych ocen tekstowych (np. \"wysoki standard\" → 3 pkt).",
        colorStyle: "border-cyan-500 !text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
    },
    {
        num: 3,
        title: "Automatyczna eliminacja",
        desc: "Nasz algorytm skanuje tabelę i bezwzględnie filtruje (Pareto Dominance) opcje, które są we wszystkim gorsze od innych. Odpadają w przedbiegach, oszczędzając Twój czas.",
        colorStyle: "border-red-500 !text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
    },
    {
        num: 4,
        title: "Kompromisy i Wygrana",
        desc: "Dokonuj równej wymiany (\"What-if\"). Zwiększaj koszt kosztem jakości, aż zrównasz ze sobą kryteria i wyłonisz ostatecznego zwycięzcę, popartego twardymi danymi (lub najwyższym wskaźnikiem EV).",
        colorStyle: "border-emerald-500 !text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
    }
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#030303] !text-white font-sans selection:bg-purple-500/30">
          
            <header className="fixed top-0 left-1/2 -translate-x-1/2 mt-6 z-50">
                <nav className="flex items-center gap-1.5 px-4 py-2 border border-white/5 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_20px_-10px_rgba(139,92,246,0.3)]">
                    <span className="font-bold text-sm tracking-tight !text-white/90 mr-4">Decidely.</span>
                    <a href="#features" className="!text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors">Cechy</a>
                    <a href="#how-it-works" className="!text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors">Jak to Działa?</a>
                    <a href="#cases" className="!text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors">Przykłady</a>
                    <Link to="/app/table?scenario=developerHiring" className="inline-flex items-center gap-1.5 ml-4 px-3.5 py-1.5 border-none rounded-full bg-purple-500 !text-white text-[12px] font-semibold cursor-pointer transition-all hover:bg-purple-600 hover:shadow-[0_0_20px_0_rgba(139,92,246,0.2)]">
                        Rozpocznij (Free)
                    </Link>
                </nav>
            </header>

         
            <section className="pt-40 pb-20 px-6 text-center max-w-[1200px] mx-auto">
                <h1 className="m-0 text-5xl md:text-7xl font-extrabold tracking-[-2px] md:tracking-[-3.5px] leading-[1.1] md:leading-[1] !text-white">
                   Podejmuj decyzje w oparciu <br />
                    o dane, nie przeczucie
                </h1>
                <p className="mt-6 mb-10 max-w-[600px] mx-auto !text-white/70 text-lg leading-relaxed">
                    Decidely zamienia niepewność w liczby. Tabela decyzyjna lub drzewo scenariuszy — metodologia prosto z Harvard Business School.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Link to="/app/table?scenario=developerHiring" className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-purple-500 !text-white border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(139,92,246,0.2)] hover:bg-purple-600">
                      Porównaj Opcje
                    </Link>
                    <Link to="/app/tree?scenario=basketball" className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-cyan-400 !text-black border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(34,211,238,0.2)] hover:bg-cyan-500">
                        Zbuduj Drzewo Decyzji
                    </Link>
                </div>
                
                {/* Pochylony Screenshot Applikacji */}
                <div className="relative mt-20 w-full max-w-[1000px] mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-cyan-400/30 blur-[80px] -z-10 rounded-full"></div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm transition-transform duration-500 hover:[transform:perspective(1000px)_rotateX(0deg)_rotateY(0deg)_scale(1.02)] [transform:perspective(1000px)_rotateX(8deg)_rotateY(-12deg)_rotateZ(2deg)_scale(1.02)]">
                        <img 
                            src="/app-screenshot-tilted.png" 
                            alt="Decision Tree Mockup" 
                            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] block" 
                        />
                    </div>
                </div>
            </section>

    
            <section id="features" className="py-20 px-6 max-w-[1200px] mx-auto">
                <h2 className="text-center m-0 text-4xl font-extrabold tracking-[-1.5px] !text-white">
                    Koniec z wyborem na czucie.
                </h2>
                <p className="text-center mt-4 text-sm !text-white/60 max-w-[600px] mx-auto">
                    Zbudowane w oparciu o metodologię Smart Choices (Harvard Business School Press) — stosowaną przy decyzjach, gdzie stawką jest coś ważnego.
                </p>
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">
                    {features.map(({ id, title, desc, Icon, wrapperClass, iconContainerClass }) => (
                        <div key={id} className={`p-8 flex flex-col justify-end gap-3 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)] ${wrapperClass}`}>
                            <div className={iconContainerClass}>
                                <Icon className="w-6 h-6 !text-white" />
                            </div>
                            <h3 className="m-0 text-xl font-bold !text-white/90">{title}</h3>
                            <p className="m-0 text-[13px] !text-white/60 leading-relaxed max-w-[500px]">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. SEKCJA JAK TO DZIAŁA (Kroki) */}
            <section id="how-it-works" className="py-24 px-6 max-w-[1000px] mx-auto">
                <h2 className="text-center m-0 text-3xl font-extrabold tracking-[-1px] !text-white">
                    Proces decyzyjny w 4 krokach
                </h2>
                <p className="text-center mt-4 mb-16 text-sm !text-white/60 max-w-[600px] mx-auto">
                    Przekształć chaos informacyjny w czystą, matematyczną odpowiedź.
                </p>

                <div className="relative border-l border-white/10 ml-4 md:ml-12 space-y-12 pb-4">
                    {steps.map(({ num, title, desc, colorStyle }) => (
                        <div key={num} className="relative pl-8 md:pl-12">
                            <div className={`absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 font-bold text-sm ${colorStyle}`}>
                                {num}
                            </div>
                            <h3 className="m-0 text-xl font-bold !text-white/90">{title}</h3>
                            <p className="mt-2 text-[14px] !text-white/60 leading-relaxed">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. SEKCJA USE CASES */}
            <section id="cases" className="py-20 px-6 max-w-[1200px] mx-auto text-center">
                <h2 className="m-0 text-3xl font-bold !text-white/90">Gdzie to się sprawdza</h2>
                <div className="mt-10 flex flex-wrap gap-3 justify-center">
                    {['Zatrudnienie Kandydata', 'Wybór Frameworka', 'Planowanie Kariery', 'Wybór Oferty Pracy', 'Kupno Samochodu'].map(item => (
                        <div key={item} className="px-4 py-1.5 border border-white/10 bg-black rounded-full text-[12px] font-medium !text-white/70 transition-colors hover:!text-white hover:border-white/30">
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. SEKCJA TECH STACK */}
            <section className="py-20 px-6 max-w-[1200px] mx-auto text-center border-t border-white/5 bg-[#010101]">
                <h4 className="m-0 text-xs font-semibold uppercase tracking-[2px] !text-white/40">Zbudowany na nowoczesnym staku</h4>
                <div className="mt-10 flex flex-wrap justify-center gap-10 items-center opacity-60">
                    {['React', 'Tailwind CSS', 'Vite', 'Zustand', 'React Flow'].map(tech => (
                        <span key={tech} className="text-xl !text-white/60 font-medium">{tech}</span>
                    ))}
                </div>
            </section>

            {/* 6. ALGORITHM SIGNATURE */}
            <section className="pb-16 px-6 text-center bg-[#010101]">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="m-0 text-[11px] uppercase tracking-wider !text-white/50 font-mono font-semibold">
                        Implements <span className="!text-emerald-400">MCDA</span>, <span className="!text-emerald-400">Expected Value Analysis</span> & <span className="!text-emerald-400">Pareto Filtering</span>.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-6 text-center text-[11px] !text-white/30 border-t border-white/5">
                © {new Date().getFullYear()} Decidely.
            </footer>
        </div>
    );
}