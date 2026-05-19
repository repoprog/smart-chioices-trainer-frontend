import apiClient from './apiClient';
import { treeScenarios } from '../features/DecisionTree/data/treeScenarios';
import { tableScenarios } from '../features/DecisionTable/data/tableScenarios';
import { API_PATHS, PROJECT_STATUS } from '../constants/apiConstants'; // <--- DODANY IMPORT

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

  async getTreeTemplate(templateId) {
    await sleep(500); // 500ms by nacieszyć oko loaderem ładowania planszy
    const data = treeScenarios[templateId];
    if (!data) throw new Error("Nie znaleziono szablonu drzewa");
    return JSON.parse(JSON.stringify(data));
  },

  async getTableTemplate(templateId) {
    await sleep(500);
    const data = tableScenarios[templateId];
    if (!data) throw new Error("Nie znaleziono szablonu tabeli");
    return JSON.parse(JSON.stringify(data));
  },

  // ==========================================
  // 2. PROJEKTY UŻYTKOWNIKA (Z BACKENDU)
  // ==========================================

  async getProject(projectId) {
    // Używamy dynamicznej stałej-funkcji
    const response = await apiClient.get(API_PATHS.PROJECTS.BY_ID(projectId));
    if (!response.data) throw new Error("Nie znaleziono decyzji");
    return response.data; 
  },

  async getUserProjects(type) {
    // Budujemy URL na bazie stałej
    const url = type 
      ? `${API_PATHS.PROJECTS.BASE}?type=${type}&size=50` 
      : `${API_PATHS.PROJECTS.BASE}?size=50`;
    const response = await apiClient.get(url);
    return response.data.content || response.data || [];
  },

  async saveTree(id, treeData) {
    await apiClient.patch(API_PATHS.PROJECTS.CONTENT(id), { content: treeData });
    return { status: "success", timestamp: new Date().toISOString() };
  },

  async saveTable(id, tableData) {
    await apiClient.patch(API_PATHS.PROJECTS.CONTENT(id), { content: tableData });
    return { status: "success", timestamp: new Date().toISOString() };
  },

  async createProject(title, type) {
    const response = await apiClient.post(API_PATHS.PROJECTS.BASE, {
      title,
      type,
      status: PROJECT_STATUS.DRAFT // Używamy stałej statusu!
    });
    return response.data;
  },

  async updateProjectMeta(id, { title, status, tags, category, notes }) {
    const response = await apiClient.put(API_PATHS.PROJECTS.BY_ID(id), {
      title,
      status,
      tags,
      category,
      notes
    });
    return response.data;
  },

  async patchNotes(id, notes) {
    const response = await apiClient.patch(API_PATHS.PROJECTS.NOTES(id), { notes });
    return response.data;
  },

  async deleteProject(id) {
    const response = await apiClient.delete(API_PATHS.PROJECTS.BY_ID(id));
    return response.data;
  },

  async createSnapshot(projectId, label) {
    const response = await apiClient.post(API_PATHS.PROJECTS.SNAPSHOTS(projectId), {label});
    return response.data; 
  },

  async getSnapshots(projectId) {
    try {
      const response = await apiClient.get(API_PATHS.PROJECTS.SNAPSHOTS(projectId));
      return Array.isArray(response.data) 
        ? response.data 
        : response.data?.content ?? [];
    } catch (error) {
      console.error(`Błąd podczas pobierania snapshotów dla decyzji ${projectId}:`, error);
      throw error;
    }
  },

  async getSnapshot(projectId, snapshotId) {
    const response = await apiClient.get(API_PATHS.PROJECTS.SNAPSHOT(projectId, snapshotId));
    return response.data; 
  },

  async analyzeTable(payload, signal) {
    const response = await apiClient.post(API_PATHS.ANALYSIS.TABLE, payload, { signal });
    return response.data; // TableAnalysisResultDTO
  },

  async analyzeTree(payload, signal) {
    const response = await apiClient.post(API_PATHS.ANALYSIS.TREE, payload, { signal });
    return response.data;
  }
};