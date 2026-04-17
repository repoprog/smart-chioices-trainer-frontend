import { treeScenarios } from '../features/DecisionTree/data/treeScenarios';
import { tableScenarios } from '../features/DecisionTable/data/tableScenarios';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const decisionApi = {
 
  async getTreeScenarios() {
    await sleep(300);
    return Object.keys(treeScenarios).map(key => ({
      id: key,
      name: treeScenarios[key].name,
      description: treeScenarios[key].description || "Brak opisu"
    }));
  },

  async getTreeById(id) {
    await sleep(500);
    const data = treeScenarios[id];
    if (!data) throw new Error("Nie znaleziono drzewa o podanym ID");
    return JSON.parse(JSON.stringify(data));
  },

  async saveTree(id, treeData) {
    await sleep(800);
    console.log(`[API MOCK] Zapisywanie drzewa ${id}:`, treeData);
    return { status: "success", timestamp: new Date().toISOString() };
  },

  async getTableScenarios() {
    await sleep(300);
    return Object.keys(tableScenarios).map(key => ({
      id: key,
      name: tableScenarios[key].name,
      description: tableScenarios[key].description || "Brak opisu"
    }));
  },

  async getTableById(id) {
    await sleep(500);
    const data = tableScenarios[id];
    if (!data) throw new Error("Nie znaleziono tabeli o podanym ID");
    return JSON.parse(JSON.stringify(data));
  }
};