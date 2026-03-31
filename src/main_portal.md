# Architektura Portalu Decyzyjnego (Smart Choices App)

## 1. Cel Projektu
Stworzenie modułowej aplikacji webowej wspomagającej podejmowanie trudnych decyzji (w oparciu m.in. o metodologię PrOACT z książki "Smart Choices"). Aplikacja ma pomagać w strukturyzowaniu problemów, analizie ryzyka i ocenie wariantów.

## 2. Stos Technologiczny
- **Framework:** React + Vite
- **Nawigacja:** React Router (do przełączania się między modułami)
- **Styling:** Tailwind CSS (stawiamy na elastyczne klasy, wygląd UI będzie jeszcze ewoluował, więc kod musi być łatwy do refaktoryzacji)
- **Zarządzanie stanem:** Zustand (osobne store'y dla poszczególnych modułów, aby nie mieszać danych)
- **Wizualizacja:** @xyflow/react (React Flow) dedykowane dla modułu Drzewa.

## 3. Struktura Modułowa
Aplikacja składa się z niezależnych narzędzi (modułów). Każdy moduł ma własną logikę i ewentualnie własny plik `.md` z detalami.

### Moduł 1: Tabela Decyzyjna (Już istnieje)
- Służy do porównywania opcji względem wielu kryteriów.
- Kontekst i logika opisane w osobnym pliku (np. `@module_decision_table.md` - *do uzupełnienia w przyszłości*).

### Moduł 2: Drzewo Decyzyjne (W trakcie budowy)
- Służy do analizy decyzji w warunkach niepewności (obliczanie Wartości Oczekiwanej - EMV).
- Kontekst, typy węzłów i logika wizualizacji opisane w pliku `@module_decision_treemd`.

## 4. Wytyczne dla AI (Instrukcje dla Cursora)
- **Czysty kod:** Pisz komponenty w sposób reużywalny. Oddzielaj logikę biznesową (Zustand, hooki) od warstwy prezentacji (UI).
- **Elastyczność UI:** Portal nie ma jeszcze ostatecznego designu. Używaj neutralnego, nowoczesnego wyglądu (np. szare tła, czytelne karty), który łatwo będzie zmienić z poziomu Tailwinda.
- **Nawigacja:** Główny layout aplikacji (`Layout.jsx`) powinien zawierać prosty Sidebar lub Navbar pozwalający na przełączanie się między Tabelą a Drzewem.