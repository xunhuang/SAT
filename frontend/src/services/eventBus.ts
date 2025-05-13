type EventCallback = (...args: any[]) => void;

/**
 * Simple event bus for inter-component communication
 */
class EventBus {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const callbacks = this.events.get(event)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event with arguments
   * @param event Event name
   * @param args Arguments to pass to the callbacks
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) {
      return;
    }

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Event names
export const EVENTS = {
  USER_SETTINGS_UPDATED: 'userSettingsUpdated'
};

export default eventBus;