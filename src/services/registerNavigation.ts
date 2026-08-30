class RegisterNavigationService {
  private handler: ((path: string) => void) | null = null;

  setNavigator(handler: (path: string) => void) {
    this.handler = handler;
  }

  trigger(targetPath: string = '/register') {
    if (this.handler) {
      this.handler(targetPath);
    } else {
      window.location.assign(targetPath);
    }
  }
}

export const registerNav = new RegisterNavigationService();
