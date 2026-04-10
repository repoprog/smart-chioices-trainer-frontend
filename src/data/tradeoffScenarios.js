export const tradeoffScenarios = {
  blank: {
    name: "Pusta tabela (Od nowa)",
    description: "Czysta karta. Dodaj własne alternatywy, cele i przeprowadź analizę od podstaw.",
    alternatives: [],
    objectives: [],
    cells: {},
    objectiveUnits: {},
    sortDirections: {}
  }, 
  carPurchase: {
    name: "Kupno samochodu",
    description: "Wybór między różnymi typami aut na podstawie kosztów i użyteczności.",
    alternatives: ["Auto A (Kompakt)", "Auto B (Kombi)", "Auto C (SUV)"],
    objectives: ["Cena zakupu", "Spalanie", "Pojemność bagażnika", "Bezpieczeństwo"],
    objectiveUnits: { 0: "zł", 1: "l/100km", 2: "litry", 3: "pkt" },
    sortDirections: { 0: "lower", 1: "lower", 2: "higher", 3: "higher" },
    cells: {
      "0-0": "85000", "0-1": "110000", "0-2": "140000",
      "1-0": "5.5",   "1-1": "6.2",    "1-2": "8.5",
      "2-0": "380",   "2-1": "550",    "2-2": "520",
      "3-0": "4",     "3-1": "5",      "3-2": "5"
    }
  },
  jobOffer: {
    name: "Wybór oferty pracy",
    description: "Porównanie ofert pod kątem zarobków, elastyczności i stresu.",
    alternatives: ["Korporacja", "Startup", "Freelance"],
    objectives: ["Wynagrodzenie netto", "Praca zdalna", "Możliwość awansu", "Poziom stresu"],
    objectiveUnits: { 0: "zł/msc", 1: "dni/tyg", 2: "pkt", 3: "pkt" },
    sortDirections: { 0: "higher", 1: "higher", 2: "higher", 3: "lower" },
    cells: {
      "0-0": "12000", "0-1": "9500", "0-2": "15000",
      "1-0": "2",     "1-1": "4",    "1-2": "5",
      "2-0": "8",     "2-1": "9",    "2-2": "3",
      "3-0": "7",     "3-1": "8",    "3-2": "9"
    }
  },
  developerHiring: {
    name: "Rekrutacja Full-Stack (Java + React)",
    description: "Wybór kandydata. Znajdź i odrzuć słabe opcje, a potem zrób kompromis między resztą.",
    alternatives: ["Jan", "Piotr", "Anna", "Kamil"],
    objectives: ["Oczekiwania finansowe", "Znajomość Java/Spring", "Znajomość React", "Doświadczenie z AWS", "Praktyka w CI/CD", "Język Angielski"],
    objectiveUnits: { 0: "zł" }, // Usunięte etykiety skali, zostawiamy tylko walutę
    // Pensja: im mniej tym lepiej (lower). Reszta skilli: im więcej tym lepiej (higher)
    sortDirections: { 0: "lower", 1: "higher", 2: "higher", 3: "higher", 4: "higher", 5: "higher" },
    cells: {
      // Oczekiwania finansowe
      "0-0": "13000", "0-1": "14000", "0-2": "15000", "0-3": "14500",
      // Java/Spring
      "1-0": "wysoki", "1-1": "średni", "1-2": "wysoki", "1-3": "średni",
      // React
      "2-0": "średni", "2-1": "niski",  "2-2": "wysoki", "2-3": "średni",
      // AWS
      "3-0": "tak",    "3-1": "nie",    "3-2": "nie",    "3-3": "nie",
      // CI/CD
      "4-0": "tak",    "4-1": "nie",    "4-2": "tak",    "4-3": "nie",
      // Język Angielski
      "5-0": "wysoki", "5-1": "średni", "5-2": "wysoki", "5-3": "średni"
    }
  }
};