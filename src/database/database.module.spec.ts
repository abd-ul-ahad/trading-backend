import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('should be defined', () => {
    expect(DatabaseModule).toBeDefined();
  });

  it('should have the correct module metadata', () => {
    // Verify the module is properly decorated
    const moduleMetadata = Reflect.getMetadata('imports', DatabaseModule);
    expect(moduleMetadata).toBeDefined();
  });
});
