# Projekt: Aplikacja Drzewa Decyzyjnego (metodologia Smart Choices)

## Cel
Stworzenie interaktywnego narzędzia w React do budowania drzew decyzyjnych i podejmowania decyzji w warunkach niepewności (obliczanie Wartości Oczekiwanej - EMV metodą backward induction).

## Stos technologiczny
- React + Vite
- Tailwind CSS (do szybkiego stylowania)
- @xyflow/react (React Flow) do wizualizacji grafu
- Zustand do zarządzania stanem drzewa

## Typy węzłów (Custom Nodes)
1. **Decision Node (Węzeł Decyzyjny - Kwadrat):** Punkt wyboru użytkownika. Kolor: niebieski.
2. **Chance Node (Węzeł Losowy/Szansy - Koło):** Zdarzenie losowe. Krawędzie wychodzące z tego węzła muszą mieć przypisane prawdopodobieństwo (np. 60%, 40% sumujące się do 100%). Kolor: pomarańczowy.
3. **Terminal Node (Węzeł Końcowy - Zaokrąglony prostokąt):** Ostateczny wynik/wartość (payoff). Kolor: zielony.

## Krawędzie (Edges)
Linie łączące węzły. Muszą obsługiwać etykiety tekstu (np. nazwa decyzji lub prawdopodobieństwo).

## Główne funkcjonalności do wdrożenia (Roadmap)
1. Renderowanie statycznego drzewa (Zrobione).
2. Dynamiczne dodawanie węzłów i krawędzi przez UI.
3. Edycja wartości w węzłach (nazwy, prawdopodobieństwa, wartości końcowe).
4. Algorytm obliczający EMV i podświetlający optymalną ścieżkę decyzji.