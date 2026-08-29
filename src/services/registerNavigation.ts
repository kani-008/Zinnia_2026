type RegisterListener = (targetPath: string) => void;

class RegisterNavigationService {
  private listeners: Set<RegisterListener> = new Set();

  subscribe(listener: RegisterListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  trigger(targetPath: string = '/register') {
    this.listeners.forEach((fn) => {
      try {
        fn(targetPath);
      } catch (e) {
        console.error('Error triggering register animation:', e);
      }
    });
  }
}

export const registerNav = new RegisterNavigationService();
