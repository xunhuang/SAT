import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Convert fs callbacks to Promises
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// Path to the data directory containing question JSON files
const DATA_DIR = path.join(__dirname, '../../../data');

// Interface for SAT question structure
export interface SATQuestion {
  externalid: string;
  stem: string;
  stimulus?: string;
  type: string;
  answerOptions: {
    id: string;
    content: string;
  }[];
  keys: string[];
  rationale?: string;
  correct_answer?: string[];
}

/**
 * Question Service
 * Handles reading and processing SAT question data from JSON files
 */
export default {
  /**
   * Get all question IDs
   * @returns Promise<string[]> Array of question IDs
   */
  async getAllQuestionIds(): Promise<string[]> {
    try {
      const files = await readdir(DATA_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      console.error('Error reading question directory:', error);
      throw new Error('Failed to retrieve question IDs');
    }
  },

  /**
   * Get questions with pagination
   * @param page Page number (starting from 1)
   * @param limit Number of questions per page
   * @returns Promise<{questions: SATQuestion[], total: number}> Paginated questions and total count
   */
  async getQuestions(page = 1, limit = 10): Promise<{ questions: SATQuestion[], total: number }> {
    try {
      const allIds = await this.getAllQuestionIds();
      const total = allIds.length;
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const pageIds = allIds.slice(startIndex, endIndex);
      
      // Read each question file
      const questionPromises = pageIds.map(id => this.getQuestionById(id));
      const questions = await Promise.all(questionPromises);
      
      return { questions, total };
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to retrieve questions');
    }
  },

  /**
   * Get a specific question by ID
   * @param id Question ID
   * @returns Promise<SATQuestion> The question data
   */
  async getQuestionById(id: string): Promise<SATQuestion> {
    try {
      const filePath = path.join(DATA_DIR, `${id}.json`);
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data) as SATQuestion;
    } catch (error) {
      console.error(`Error reading question ${id}:`, error);
      throw new Error(`Question not found: ${id}`);
    }
  },

  /**
   * Get a random question
   * @returns Promise<SATQuestion> A random question
   */
  async getRandomQuestion(): Promise<SATQuestion> {
    try {
      const allIds = await this.getAllQuestionIds();
      if (allIds.length === 0) {
        throw new Error('No questions available');
      }
      
      const randomIndex = Math.floor(Math.random() * allIds.length);
      const randomId = allIds[randomIndex];
      
      return await this.getQuestionById(randomId);
    } catch (error) {
      console.error('Error getting random question:', error);
      throw new Error('Failed to retrieve random question');
    }
  }
}