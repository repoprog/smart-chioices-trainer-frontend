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

  // NOWE: Dedykowana metoda tylko dla szablonów drzewa
  async getTreeTemplate(templateId) {
    await sleep(500); // 500ms by nacieszyć oko loaderem ładowania planszy
    const data = treeScenarios[templateId];
    if (!data) throw new Error("Nie znaleziono szablonu drzewa");
    return JSON.parse(JSON.stringify(data));
  },

  // NOWE: Dedykowana metoda tylko dla szablonów tabeli
  async getTableTemplate(templateId) {
    await sleep(500);
    const data = tableScenarios[templateId];
    if (!data) throw new Error("Nie znaleziono szablonu tabeli");
    return JSON.parse(JSON.stringify(data));
  },

  // ==========================================
  // 2. PROJEKTY UŻYTKOWNIKA (Z BACKENDU)
  // ==========================================

  // JEDNA uniwersalna funkcja do pobierania dowolnego projektu
  async getProject(projectId) {
    const response = await apiClient.get(`/api/v1/projects/${projectId}`);
    if (!response.data) throw new Error("Nie znaleziono projektu");
    return response.data; // Zwracamy cały ProjectDetailDTO
  },

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
  },
  // Wewnątrz obiektu decisionApi:
  async createSnapshot(projectId, label) {
    // Zakładam, że Twój endpoint przyjmuje body z polem "label"
    const response = await apiClient.post(`/api/v1/projects/${projectId}/snapshots`, { label });
    return response.data; 
  },

 // Metoda do pobierania listy snapshotów dla danego projektu
  async getSnapshots(projectId) {
    const response = await apiClient.get(`/api/v1/projects/${projectId}/snapshots`);
    return response.data; // Zwraca listę obiektów snapshotów
  },

  // NOWE: Metoda do pobierania zawartości konkretnego, JEDNEGO snapshotu
  async getSnapshot(projectId, snapshotId) {
    const response = await apiClient.get(`/api/v1/projects/${projectId}/snapshots/${snapshotId}`);
    return response.data; 
  }
};