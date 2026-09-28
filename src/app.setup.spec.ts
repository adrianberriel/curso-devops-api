import { INestApplication, ValidationPipe } from '@nestjs/common';
import { configureApp } from './app.setup.js';

describe('configureApp', () => {
  const appDouble = () => ({ useGlobalPipes: vi.fn() }) as unknown as INestApplication;

  it('should register the global ValidationPipe', () => {
    const app = appDouble();

    configureApp(app);

    expect(app.useGlobalPipes).toHaveBeenCalledOnce();
    expect(vi.mocked(app.useGlobalPipes).mock.calls[0][0]).toBeInstanceOf(ValidationPipe);
  });

  it('should return the same app instance, so it can be chained', () => {
    const app = appDouble();

    expect(configureApp(app)).toBe(app);
  });
});
