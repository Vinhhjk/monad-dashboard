export class RateLimiter {
  private queue: (() => Promise<unknown>)[] = [];
  private processing = false;
  private readonly delay: number;

  constructor(requestsPerSecond: number = 20) {
    this.delay = 1000 / requestsPerSecond;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error: unknown) {
          // Check for rate limit error (customize this check as needed)
          if (
            typeof (error as { message?: string })?.message === 'string' &&
            ((error as { message: string }).message.toLowerCase().includes('rate limit'))
          ) {
            // Wait 1 second before continuing
            await new Promise(res => setTimeout(res, 1000));
          }
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}