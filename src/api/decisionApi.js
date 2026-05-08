import apiClient from './apiClient';
import { treeScenarios } from '../features/DecisionTree/data/treeScenarios';
import { tableScenarios } from '../features/DecisionTable/data/tableScenarios';

// Pomocnicza funkcja do imitowania opóźnienia
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const decisionApi = {
  // ==========================================
  // 1. SZABLONY / PRZYKŁADY (Z FRONTENDU)
  // ==========================================

  async getTreeScenarios() {
    await sleep(300); // Pokazujemy loader przy otwieraniu okienka z szablonami
    return Object.keys(treeScenarios).map(key => ({
      id: key,
      name: treeScenarios[key].name,
      description: treeScenarios[key].description || "Brak opisu"
    }));
  },

  async getTableScenarios() {
    await sleep(300);
    return Object.keys(tableScenarios).map(key => ({
      id: key,
      name: tableScenarios[key].name,
      description: tableScenarios[key].description || "Brak opisu"
    }));
  },

  async getTreeById(id) {
    if (id.length > 20) {
      // PROJEKT Z BACKENDU
      const response = await apiClient.get(`/api/v1/projects/${id}`);
      const data = response.data.content;
      if (!data) throw new Error("Projekt jest pusty");
      return JSON.parse(JSON.stringify(data));
    } else {
      // SZABLON Z FRONTENDU
      await sleep(500); // 500ms by nacieszyć oko loaderem ładowania planszy
      const data = treeScenarios[id];
      if (!data) throw new Error("Nie znaleziono szablonu drzewa");
      return JSON.parse(JSON.stringify(data));
    }
  },

  async getTableById(id) {
    if (id.length > 20) {
      // PROJEKT Z BACKENDU
      const response = await apiClient.get(`/api/v1/projects/${id}`);
      const data = response.data.content;
      if (!data) throw new Error("Projekt jest pusty");
      return JSON.parse(JSON.stringify(data));
    } else {
      // SZABLON Z FRONTENDU
      await sleep(500); // 500ms opóźnienia
      const data = tableScenarios[id];
      if (!data) throw new Error("Nie znaleziono szablonu tabeli");
      return JSON.parse(JSON.stringify(data));
    }
  },

  // ==========================================
  // 2. PROJEKTY UŻYTKOWNIKA (Z BACKENDU)
  // (Prawdziwe opóźnienie zależy od serwera, tu nie dajemy sleep)
  // ==========================================

  async getUserProjects(type) {
    const url = type ? `/api/v1/projects?type=${type}&size=50` : '/api/v1/projects?size=50';
    const response = await apiClient.get(url);
    return response.data.content || response.data || [];
  },

  async saveTree(id, treeData) {
    await apiClient.patch(`/api/v1/projects/${id}/content`, { content: treeData });
    return { status: "success", timestamp: new Date().toISOString() };
  },

  async saveTable(id, tableData) {
    await apiClient.patch(`/api/v1/projects/${id}/content`, { content: tableData });
    return { status: "success", timestamp: new Date().toISOString() };
  },

  async createProject(title, type) {
    const response = await apiClient.post('/api/v1/projects', {
      title,
      type,
      status: 'DRAFT'
    });
    return response.data;
  },

  async updateProjectMeta(id, { title, status, tags, category, notes }) {
    const response = await apiClient.put(`/api/v1/projects/${id}`, {
      title,
      status,
      tags,
      category,
      notes
    });
    return response.data;
  },

  async patchNotes(id, notes) {
    const response = await apiClient.patch(`/api/v1/projects/${id}/notes`, { notes });
    return response.data;
  },

  async deleteProject(id) {
    const response = await apiClient.delete(`/api/v1/projects/${id}`);
    return response.data;
  }
};